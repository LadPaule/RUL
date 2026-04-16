import pandas as pd
import numpy as np
from  pathlib import Path

COLUMN_NAMES = [
    'unit_number', 'time_cycles', 'op_setting_1', 
    'op_setting_2', 'op_setting_3',
    *[f'sensor_{i}' for i in range(1, 22)]
]

def load_cmapss_file(file_path):
    """
    Load space-separated CMAPSS file.
    """
    return pd.read_csv(file_path, sep=r'\s+', header=None, names=COLUMN_NAMES)

def compute_rul(df):
    """
    Compute RUL as max cycles per unit - current cycle.
    """
    max_cycle = df.groupby('unit_number')['time_cycles'].max().reset_index()
    max_cycle.columns = ['unit_number', 'max_cycles']

    df = df.merge(max_cycle, on='unit_number')
    df['RUL'] = df['max_cycles'] - df['time_cycles']
    return df.drop('max_cycles', axis=1)

def load_train_data(train_path):
    df = load_cmapss_file(train_path)
    df = compute_rul(df)
    return df

def load_test_data(test_path, rul_path):
    df = load_cmapss_file(test_path)
    rul_true = pd.read_csv(rul_path, sep =r'\s+', header=None, names=['RUL_true'])
    # RUL_true is the last cycle of each engine in order.
    engines = df['unit_number'].unique()
    true_rul_dict = { engines[i]: rul_true.iloc[i, 0] for i in range(len(engines)) }
    return df, true_rul_dict



