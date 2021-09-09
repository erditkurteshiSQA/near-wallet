import { connectRouter } from 'connected-react-router';
import { localizeReducer } from 'react-localize-redux';
import { combineReducers } from 'redux';

import account from './reducers/account';
import allAccounts from './reducers/allAccounts';
import availableAccounts from './reducers/available-accounts';
import ledger from './reducers/ledger';
import recoveryMethods from './reducers/recoveryMethods';
import sign from './reducers/sign';
import staking from './reducers/staking';
import status from './reducers/status';
import flowLimitationSlice from './slices/flowLimitation';
import linkdropSlice from './slices/linkdrop';
import nftSlice from './slices/nft';
import tokenFiatValuesSlice from './slices/tokenFiatValues';
import tokensSlice from './slices/tokens';
import transactionsSlice from './slices/transactions';

export default (history) => combineReducers({
    localize: localizeReducer,
    allAccounts,
    availableAccounts,
    account,
    sign,
    recoveryMethods,
    ledger,
    staking,
    status,
    [nftSlice.name]: nftSlice.reducer,
    [tokenFiatValuesSlice.name]: tokenFiatValuesSlice.reducer,
    [linkdropSlice.name]: linkdropSlice.reducer,
    [transactionsSlice.name]: transactionsSlice.reducer,
    [tokensSlice.name]: tokensSlice.reducer,
    [flowLimitationSlice.name]: flowLimitationSlice.reducer,
    router: connectRouter(history)
});