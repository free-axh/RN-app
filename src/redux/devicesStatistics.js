import { Map } from 'immutable';
import { delay } from 'redux-saga';
import * as timeFormat from 'd3-time-format';
import {
  put, call, takeLatest,
} from './common';
import {
  terminalMileageBar,
  terminalMileageDetailData,
} from '../server/getData';
import { getCurrentTime } from '../utils/function';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
let nowEndTime = '';

// action
const INIT_ACTION = { type: 'devicesStatistics/SAGA/INIT_ACTION' };
const INIT_START_ACTION = { type: 'devicesStatistics/INIT_START_ACTION' };
const INIT_SUCCESS_ACTION = { type: 'devicesStatistics/INIT_SUCCESS_ACTION' };
const INIT_FAIL_ACTION = { type: 'devicesStatistics/INIT_FAIL_ACTION' };

const GET_DETAILS_START_ACTION = { type: 'devicesStatistics/GET_DETAILS_START_ACTION' };
const GET_DETAILS_ACTION = { type: 'devicesStatistics/SAGA/GET_DETAILS_ACTION' };
const GET_DETAILS_SUCCESS_ACTION = { type: 'devicesStatistics/GET_DETAILS_SUCCESS_ACTION' };
const GET_DETAILS_FAIL_ACTION = { type: 'devicesStatistics/GET_DETAILS_FAIL_ACTION' };

const RESET_DETAIL_ACTION = { type: 'devicesStatistics/SAGA/RESET_DETAIL_ACTION' };
const RESET_DETAIL_START_ACTION = { type: 'devicesStatistics/RESET_DETAIL_START_ACTION' };
const RESET_DETAIL_SUCCESS_ACTION = { type: 'devicesStatistics/RESET_DETAIL_SUCCESS_ACTION' };


// reducer
const defaultState = Map({
  initStatus: 'ing', // ing,end
  isSuccess: true,
  queryPeriod: 31,
  barChartData: null,
  barDetailData: null,
  currentIndex: null,
  extraState: null,
});

const devicesStatisticsReducers = (state = defaultState, { type, payload }) => {
  let newState = null;
  switch (type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
        isSuccess: true,
        barChartData: null,
        barDetailData: null,
        currentIndex: null,
        extraState: null,
      });
      return newState;
    case INIT_SUCCESS_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: true,
        barChartData: payload.barChartData,
        currentIndex: null,
        extraState: payload.extraState,
      });

      return newState;
    case INIT_FAIL_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: false,
      });
      return newState;
    case GET_DETAILS_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
      });
      return newState;
    case GET_DETAILS_SUCCESS_ACTION.type:
      newState = state.merge({
        barDetailData: payload.details,
        initStatus: 'end',
        isSuccess: true,
        currentIndex: payload.currentIndex,
      });
      return newState;
    case GET_DETAILS_FAIL_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: false,
      });
      return newState;
    case RESET_DETAIL_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
      });
      return newState;
    case RESET_DETAIL_SUCCESS_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        barDetailData: null,
        currentIndex: payload.currentIndex,
      });
      return newState;
    default:
      return state;
  }
};

// saga
function* initRequest({ payload }) {
  const {
    monitors,
    startTime,
    endTime,
  } = payload;
  yield put({
    type: INIT_START_ACTION.type,
  });

  nowEndTime = (endTime >= getCurrentTime(1)) ? timeFormator(new Date()) : `${endTime} 23:59:59`;// 判断自定义时间是否超过当前时间
  const param = {
    vehicleId: monitors.join(','),
    startTime: `${startTime} 00:00:00`,
    endTime: nowEndTime,
  };

  // console.log('里程统计图表1', param);
  const barResult = yield call(terminalMileageBar, param);
  // console.log('里程统计图表2', barResult);

  if (barResult === false || barResult.statusCode !== 200) {
    yield put({ type: INIT_FAIL_ACTION.type });
    return;
  }

  const { obj } = barResult;
  yield put({
    type: INIT_SUCCESS_ACTION.type,
    payload: {
      barChartData: obj,
      extraState: payload.extraState,
    },
  });
}

function* getDetailData({ payload }) {
  try {
    const {
      moniterId, startTime,
      // endTime,
      index,
    } = payload;

    yield put({
      type: GET_DETAILS_START_ACTION.type,
    });

    const param = {
      vehicleId: moniterId,
      startTime: `${startTime} 00:00:00`,
      endTime: nowEndTime,
    };
    console.log('里程统计详情1', param);

    const result = yield call(terminalMileageDetailData, param);
    console.log('里程统计详情2', result);

    if (result === false || result.statusCode !== 200) {
      yield put({ type: GET_DETAILS_FAIL_ACTION.type });
      return;
    }

    yield put({
      type: GET_DETAILS_SUCCESS_ACTION.type,
      payload: {
        details: result.obj,
        currentIndex: index,
      },
    });
  } catch (error) {
    yield put({ type: GET_DETAILS_FAIL_ACTION.type });
  }
}

function* resetDetails({ payload }) {
  yield put({
    type: RESET_DETAIL_START_ACTION.type,
  });

  yield delay(100);

  yield put({
    type: RESET_DETAIL_SUCCESS_ACTION.type,
    payload,
  });
}

function* devicesStatisticsSaga() {
  yield takeLatest(INIT_ACTION.type, initRequest);
  yield takeLatest(GET_DETAILS_ACTION.type, getDetailData);
  yield takeLatest(RESET_DETAIL_ACTION.type, resetDetails);
}

// 导出
export default {
  devicesStatisticsReducers,
  devicesStatisticsSaga,
};
