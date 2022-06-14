export const generateMigrationPin = () =>{
    return Math.floor(100000 + Math.random() * 900000);
};


export const getExportQueryFromAccounts = (accounts) => {
    let keys = [];
    let ledgerHdPaths = [];
    let accountStringEncodes = [];

    accounts.forEach((accountId) => {
        const accountKey = localStorage.getItem(`nearlib:keystore:${accountId}:default`);
        const ledgerHdPath = localStorage.getItem(`ledgerHdPath:${accountId}`);


        if (accountKey && !keys.includes(accountKey)) {
            keys.push(accountKey);
        }

        if (ledgerHdPath && !ledgerHdPaths.includes(ledgerHdPath)) {
            ledgerHdPaths.push(ledgerHdPath);
        }

        const keyIndex = keys.indexOf(accountKey);
        const ledgerPathIndex = ledgerHdPaths.indexOf(ledgerHdPath) == -1 ? 0 : ledgerHdPaths.indexOf(ledgerHdPath);
        let accountStringEncode = `${accountId}*${keyIndex}*${ledgerPathIndex}`; 
        accountStringEncodes.push(accountStringEncode);
    });
    const stringifiedQuery = `keys=${keys.join(',')}&ledgerHdPaths=${ledgerHdPaths.join(',')}&accounts=${accountStringEncodes.join(',')}`;

    return stringifiedQuery;
};

