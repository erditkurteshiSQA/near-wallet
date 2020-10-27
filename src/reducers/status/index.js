import { handleActions, combineActions } from 'redux-actions'
import reduceReducers from 'reduce-reducers'

import {
    clear,
    clearAlert
} from '../../actions/status'

const initialState = {
    mainLoader: false,
    actionsPending: [],
    actionStatus: {},
    globalAlert: {},
    requestStatus: {}
}

const alertReducer = (state, { error, ready, payload, meta, type }) => {
    const actionStatus = {
        ...state.actionStatus,
        [type]: {
            success: typeof ready === 'undefined' 
                ? !error
                : (ready ? !error : undefined),
            pending: typeof ready === 'undefined' 
                ? undefined 
                : !ready,
            errorType: payload?.type,
            errorMessage: (error && payload?.toString()) || undefined,
            data: {
                ...meta?.data,
                ...payload
            } 
        }
    }

    return {
        ...state,
        actionStatus,
        mainLoader: Object.keys(actionStatus).reduce((x, action) => actionStatus[action]?.pending || x, false),
        globalAlert: {
            ...state.globalAlert,
            [type]: (meta?.alert?.showAlert || payload?.data?.showAlert)
                ? {
                    show: ready && ((meta?.alert?.onlyError && error) || (meta?.alert?.onlySuccess && !error)),
                    messageCodeHeader: meta?.alert?.messageCodeHeader
                        ? `alert.${type}.${meta.alert.messageCodeHeader}`
                        : undefined,
                    messageCode: 
                        payload?.messageCode 
                        || (error
                            ? payload.type
                                ? `alert.${payload.type}`
                                : `alert.${type}.error`
                            : `alert.${type}.success`),
                    console: error && (meta.alert?.console || payload.data?.console)
                }
                : undefined
        },
        requestStatus: meta?.alert?.requestStatus
            ? {
                show: ready,
                success: ready && !error,
                messageCode: `alert.${type}.${
                    ready
                        ? error
                            ? 'error'
                            : 'success'
                        : 'pending'
                }`
            }
            : undefined
    }
}

const clearReducer = handleActions({
    [clear]: state => Object.keys(state)
        .reduce((obj, key) => (
            key !== 'requestStatus' 
                ? (obj[key] = state[key], obj) 
                : obj)
        , {}),
    [clearAlert]: (state, { payload }) => ({
        ...state,
        globalAlert: !payload 
            ? {} 
            : Object.keys(state.globalAlert).reduce((x, type) => ({
                ...x,
                ...(type !== payload
                    ? {
                        [type]: state.globalAlert[type]
                    }
                    : undefined)
            }), {})
    })
}, initialState)

export default reduceReducers(
    initialState,
    alertReducer,
    clearReducer
)
