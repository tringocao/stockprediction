from flask import Flask, request, jsonify
import pandas as pd
from datetime import datetime
from datetime import timedelta
from flask_cors import CORS
import time
import os
import pandas_datareader as web
from sklearn.preprocessing import MinMaxScaler

from tensorflow.keras.models import Sequential, load_model

app = Flask(__name__)
CORS(app)
TIME_STEPS = 15
DELTA_T = 4
SRCDIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTDIR = os.path.join(SRCDIR, 'output')


def _fetch_data(stock_name, start_date, end_date):
    df = web.DataReader(stock_name, data_source='yahoo', start=start_date, end=end_date)
    # create a new data frame that include attributes (High, Low, Open, Close, Volume)
    data = df.filter(['High', 'Low', 'Open', 'Close', 'Volume'])
    return data


@app.route('/fetch_data')
def fetch_data():
    stock_name = request.args.get('stock_name')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    dataset = _fetch_data(stock_name, start_date, end_date)
    return jsonify(dataset.to_dict('records'))


def _fetch_model(stock_name, time_steps=TIME_STEPS, delta_t=DELTA_T):
    model = load_model(os.path.join(OUTPUTDIR, '%s_%s_%s_model.h5' % (stock_name, time_steps, delta_t)))
    return model


def _data_preprocessing(dataset, time_steps=TIME_STEPS, delta_t=DELTA_T):
    dataset = dataset.tail(15)
    unscaled_data = dataset.values
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(unscaled_data)
    dim_0 = scaled_data.shape[0] - time_steps - delta_t
    dim_1 = scaled_data.shape[1]
    data = scaled_data.reshape((dim_0, time_teps, dim_1))
    return data


@app.route('/predict')
def predict():
    # Note: here we will assump the current_date has a valid value and format
    stock_name = request.args.get('stock_name')
    current_date = request.args.get('current_date')
    time_steps = request.args.get('time_steps', TIME_STEPS)
    delta_t = request.args.get('delta_t', DELTA_T)

    end_date = datetime.strptime(current_date, '%Y-%m-%d')
    start_date = end_date - timedelta(days=100)
    end_date_str = end_date.strftime('%Y-%m-%d')
    start_date_str = start_date.strftime('%Y-%m-%d')
    dataset = _fetch_data(stock_name, start_date_str, end_date_str)
    data = _data_preprocessing(dataset, time_steps, delta_t)
    model = _fetch_model(stock_name, time_steps, delta_t)
    pred = model.predict(data)
    return {
        'result': pred.tolist()
    }
