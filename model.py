from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import datetime
from datetime import timedelta
import time
import os
import pandas_datareader as web
from sklearn.preprocessing import MinMaxScaler

from tensorflow.keras.models import Sequential, load_model

app = Flask(__name__)
CORS(app)
params = {
    "batch_size": 8,
    "epochs": 100,
    "lr": 0.0001,
    "time_steps": 15,
    "delta_t": 4
}
TIME_STEPS = 15
DELTA_T = 4
SRCDIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTDIR = os.path.join(SRCDIR, 'output')
scaler = MinMaxScaler(feature_range=(0, 1))
index = 3 # index of predicted value, i.e: Close index here

def _fetch_data(stock_name, start_date, end_date, with_date=False):
    df = web.DataReader(stock_name, data_source='yahoo', start=start_date, end=end_date)
    # create a new data frame that include attributes (High, Low, Open, Close, Volume)
    if with_date:
        data = df.reset_index().filter(['Date', 'High', 'Low', 'Open', 'Close', 'Volume'])
        data['Date'] = data.astype(str)
    else:
        data = df.filter(['High', 'Low', 'Open', 'Close', 'Volume'])
    return data
	
@app.route('/upload_params')
def upload_params():
    params["time_steps"] = request.args.get('timestamp')
    params["epochs"] = request.args.get('epoch')
    params["lr"] = request.args.get('learningrate')
    return {
        'time_steps': params["time_steps"],
        'epochs': params["epochs"],
        'lr': params["lr"],
    }

@app.route('/fetch_data')
def fetch_data():
    stock_name = request.args.get('stock_name')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    dataset = _fetch_data(stock_name, start_date, end_date, with_date=True)
    date = dataset['Date']
    volume = dataset['Volume']
    stock_values = dataset[['Open', 'Close', 'Low', 'High']]
    return jsonify(date=date.values.tolist(), volume=volume.values.tolist(), data=stock_values.values.tolist())


def _fetch_model(stock_name, time_steps=TIME_STEPS, delta_t=DELTA_T):
    model = load_model(os.path.join(OUTPUTDIR, '%s_%s_%s_model.h5' % (stock_name, time_steps, delta_t)))
    return model


def _data_preprocessing(dataset, time_steps=TIME_STEPS, delta_t=DELTA_T):
    unscaled_data = dataset.values
    scaled_data = scaler.fit_transform(unscaled_data)
    dim_0 = scaled_data.shape[0] - time_steps - delta_t
    dim_1 = scaled_data.shape[1]
    data = scaled_data.reshape((dim_0, time_steps, dim_1))
    return data


def _postpropcessing(pred):
    _pred = (pred * scaler.data_range_[index]) + scaler.data_min_[index]
    return _pred

@app.route('/predict')
def predict():
    # Note: here we will assump the current_date has a valid value and format
    stock_name = request.args.get('stock_name')
    current_date = request.args.get('current_date')
    open_value = request.args.get('open')
    close_value = request.args.get('close')
    high_value = request.args.get('high')
    low_value = request.args.get('low')
    time_steps = request.args.get('time_steps', TIME_STEPS)
    delta_t = request.args.get('delta_t', DELTA_T)
    if not current_date:
        current_date = datetime.now.strftime('%Y-%m-%d')
    end_date = datetime.strptime(current_date, '%Y-%m-%d')
    start_date = end_date - timedelta(days=100)
    end_date_str = end_date.strftime('%Y-%m-%d')
    start_date_str = start_date.strftime('%Y-%m-%d')

    date_list = []
    for i in range(1, delta_t + 1):
        next_date = end_date + timedelta(days=i)
        date_list += [next_date.strftime('%Y-%m-%d')]

    dataset = _fetch_data(stock_name, start_date_str, end_date_str)

    if current_date:
        dataset = dataset.tail(15)
    else:
        new_entry = pd.DataFrame({'Open': [open_value],
                                  'High': [high_value],
                                  'Low': [low_valcue],
                                  'Close': [close_value]})
        dataset = pd.concat([dataset.iloc[-15:-1], new_entry], ignore_index=True)
    data = _data_preprocessing(dataset, time_steps, delta_t)
    model = _fetch_model(stock_name, time_steps, delta_t)
    pred = model.predict(data)
    pred = _postpropcessing(pred)
    return {
        'data': pred.tolist(),
        'date': date_list,
        'volume': [-1]*delta_t,
    }
