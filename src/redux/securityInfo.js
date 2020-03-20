import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import {
  getDayRiskNum, getDayRiskDetail,
  // getRiskEvent, getMediaInfo, getDealRisk,
} from '../server/getData';

// action
const GET_RISKNUM_ACTION = { type: 'securityInfo/SAGA/GET_RISKNUM_ACTION' };
const GET_RISKNUM_SUCCESS = { type: 'securityInfo/GET_RISKNUM_SUCCESS' };
const GET_RISKNUM_FAILED = { type: 'securityInfo/GET_RISKNUM_FAILED' };

const GET_RISK_ACTION = { type: 'securityInfo/SAGA/GET_RISK_ACTION' };
const GET_RISK_SUCCESS = { type: 'securityInfo/GET_RISK_SUCCESS' };
const GET_RISK_FAILED = { type: 'securityInfo/GET_RISK_FAILED' };

// const GET_EVENT_ACTION = { type: 'securityInfo/GET_EVENT_ACTION' };
// const GET_EVENT_SUCCESS = { type: 'securityInfo/GET_EVENT_SUCCESS' };
// const GET_EVENT_FAILED = { type: 'securityInfo/GET_EVENT_FAILED' };

// const GET_MEDIA_ACTION = { type: 'securityInfo/GET_MEDIA_ACTION' };
// const GET_MEDIA_SUCCESS = { type: 'securityInfo/GET_MEDIA_SUCCESS' };
// const GET_MEDIA_FAILED = { type: 'securityInfo/GET_MEDIA_FAILED' };

// const DEAL_RISK_ACTION = { type: 'securityInfo/DEAL_RISK_ACTION' };
// const DEAL_RISK_SUCCESS = { type: 'securityInfo/DEAL_RISK_SUCCESS' };
// const DEAL_RISK_FAILED = { type: 'securityInfo/DEAL_RISK_FAILED' };

// reducer
const defaultState = Map({
  dayNumList: [],
  dayNumStatus: 'failed',
  riskLists: [],
  riskStatus: 'failed',
  riskIds: [],
  eventLists: [],
  eventStatus: 'failed',
  mediaInfo: [],
  mediaStatus: 'failed',
  dealStatus: 'failed',
  key_: 0,
});

const securityInfoReducers = (state = defaultState, action) => {
  let newState = null;

  switch (action.type) {
    // 风险统计列表
    case GET_RISKNUM_SUCCESS.type:
      newState = state.merge({
        dayNumList: action.datas.dayNumList,
        riskLists: action.datas.riskLists,
        riskIds: action.datas.riskIds,
        dayNumStatus: 'success',
        riskStatus: 'empty',
        key_: action.datas.dayNumList.length === 0 ? Math.random() : 0,
      });
      return newState;
    case GET_RISKNUM_FAILED.type:
      newState = state.merge({
        dayNumStatus: 'failed',
        riskStatus: 'empty',
      });
      return newState;
    // 风险详情列表
    case GET_RISK_SUCCESS.type:
      newState = state.merge({
        riskLists: action.datas.riskLists,
        riskIds: action.datas.riskIds,
        riskStatus: 'success',
        dayNumStatus: 'empty',
        key_: action.datas.riskLists.length === 0 ? Math.random() : 0,
      });
      return newState;
    case GET_RISK_FAILED.type:
      newState = state.merge({
        riskStatus: 'failed',
        dayNumStatus: 'empty',
      });
      return newState;
      // 风险事件
    // case GET_EVENT_SUCCESS.type:
    //   newState = state.merge({
    //     eventLists: action.datas,
    //     eventStatus: 'success',
    //     riskStatus: 'empty',
    //     dayNumStatus: 'empty',
    //     key_: action.datas.length === 0 ? Math.random() : 0,
    //   });
    //   return newState;
    // case GET_EVENT_FAILED.type:
    //   newState = state.merge({
    //     eventStatus: 'failed',
    //     riskStatus: 'empty',
    //     dayNumStatus: 'empty',
    //   });
    //   return newState;
    //   // 多媒体列表数据
    // case GET_MEDIA_SUCCESS.type:
    //   newState = state.merge({
    //     mediaInfo: action.datas,
    //     mediaStatus: 'success',
    //   });
    //   return newState;
    // case GET_MEDIA_FAILED.type:
    //   newState = state.merge({
    //     mediaStatus: 'failed',
    //   });
    //   return newState;
    //   // 处理风险事件
    // case DEAL_RISK_SUCCESS.type:
    //   newState = state.merge({
    //     dealStatus: 'success',
    //   });
    //   return newState;
    // case DEAL_RISK_FAILED.type:
    //   newState = state.merge({
    //     dealStatus: 'failed',
    //   });
    //   return newState;
    default:
      return state;
  }
};

// 报警列表统计信息
function* getDayNum({ params }) {
  const params1 = {
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    vehicleId: params.vehicleId,
    maxQueryDay: params.maxQueryDay,
  };
  console.log('报警数量1', params1);
  const result = yield call(getDayRiskNum, params1);
  if (!result) {
    yield put({ type: GET_RISKNUM_FAILED.type });
    return;
  }
  console.log('报警数量2', result);

  if (result.success) {
    // 获取第一个事件列表
    let data2 = [];
    const riskIds = [];
    if (result.obj && result.obj.length > 0 && params.pageNum === 1) {
      const start = `${result.obj[0].day} 00:00:00`;// 开始时间

      const params2 = {
        pageNum: params.innerPageNum,
        pageSize: params.innerPageSize,
        vehicleId: params.vehicleId,
        startTime: start,
        endTime: params.endTime,
        riskIds,
      };

      // console.log('初始报警列表1', params2);
      const result2 = yield call(getDayRiskDetail, params2);
      // console.log('初始报警列表2', result2);
      if (result2.success) {
        data2 = (result2.obj && result2.obj.length > 0) ? result2.obj : [];
      }

      // 获取已经存在的报警事件id
      for (let i = 0, len = data2.length; i < len; i += 1) {
        const item = data2[i];
        riskIds.push(item.id);
      }
    }

    const data = {
      dayNumList: (result.obj && result.obj.length > 0) ? result.obj : [],
      riskLists: data2,
      riskIds,
    };

    yield put({ type: GET_RISKNUM_SUCCESS.type, datas: data });
  } else {
    yield put({ type: GET_RISKNUM_FAILED.type });
  }
}

// 报警列表详情信息
function* getRiskLists({ params }) {
  console.log('初始风险列表1', params);
  const result = yield call(getDayRiskDetail, params);
  if (!result) {
    yield put({ type: GET_RISK_FAILED.type });
    return;
  }
  console.log('初始风险列表2', result);

  if (result.success) {
    // 获取已经存在的风险id
    const riskIds = [];
    if (result.obj && result.obj.length > 0) {
      for (let i = 0, len = result.obj.length; i < len; i += 1) {
        const item = result.obj[i];
        riskIds.push(item.id);
      }
    }

    const data = {
      riskLists: (result.obj && result.obj.length > 0) ? result.obj : [],
      riskIds,
    };
    yield put({ type: GET_RISK_SUCCESS.type, datas: data });
  } else {
    yield put({ type: GET_RISK_FAILED.type });
  }
}

// 获取报警事件列表
// function* getEventLists({ params }) {
//   console.log('风险事件列表1', params);
//   const result = yield call(getRiskEvent, params);
//   console.log('风险事件列表2', result);

//   if (!result) {
//     yield put({ type: GET_EVENT_FAILED.type });
//     return;
//   }

//   if (result.success) {
//     const data = (result.obj && result.obj.length > 0) ? result.obj : [];
//     yield put({ type: GET_EVENT_SUCCESS.type, datas: data });
//   } else {
//     yield put({ type: GET_EVENT_FAILED.type });
//   }
// }

// // 获取多媒体数据列表
// function* getMediaList({ params }) {
//   console.log('风控证据1', params);
//   const result = yield call(getMediaInfo, params);
//   console.log('风控证据2', params);

//   if (!result) {
//     yield put({ type: GET_MEDIA_FAILED.type });
//     return;
//   }

//   if (result.success) {
//     const data = result.obj;
//     yield put({ type: GET_MEDIA_SUCCESS.type, datas: data });
//   } else {
//     yield put({ type: GET_MEDIA_FAILED.type });
//   }
// }

// // 处理风险
// function* getDealRisks({ params }) {
//   console.log('处理风险1', params);
//   const result = yield call(getDealRisk, params);
//   console.log('处理风险2', result);

//   if (!result) {
//     yield put({ type: DEAL_RISK_FAILED.type });
//     return;
//   }

//   if (result.success) {
//     if (result.statusCode === 200 && result.obj) {
//       yield put({ type: DEAL_RISK_SUCCESS.type });
//     } else {
//       yield put({ type: DEAL_RISK_FAILED.type });
//     }
//   } else {
//     yield put({ type: DEAL_RISK_FAILED.type });
//   }
// }

function* securityInfoSaga() {
  yield takeEvery(GET_RISKNUM_ACTION.type, getDayNum);
  yield takeEvery(GET_RISK_ACTION.type, getRiskLists);
  // yield takeEvery(GET_EVENT_ACTION.type, getEventLists);
  // yield takeEvery(GET_MEDIA_ACTION.type, getMediaList);
  // yield takeEvery(DEAL_RISK_ACTION.type, getDealRisks);
}

// 导出
export default {
  securityInfoReducers,
  securityInfoSaga,
};
