import React from 'react';
import initComposer from '../store/composer'; // todo: revert
// import initStore from '../store/store';
import initStore, { ENQ_ASK, ENQ_SEND } from '../store/store';

import { loggerOn, loggerOff } from '../utils/logger'; // eslint-disable-line
const logger = loggerOff; // note: debug
const loggerHot = loggerOff; // note: debug

const getID = keyPref => `${keyPref}${Math.round(Math.random() * 100)}`;

class AddonManager {
    constructor() {
        logger.warn('##### AddonManager ######');
        this.defaultData = {};
        this.addonApi = {};
        this.addonConfig = {};
        this.storesMap = {};
        this.subscribers = [];

        this.setDefaultData = this.setDefaultData.bind(this);
        this.setAddonApi = this.setAddonApi.bind(this);
        this.setConfig = this.setConfig.bind(this);
        this.newStore = this.newStore.bind(this);
    }

    setDefaultData(data) {
        this.defaultData = data;
    }

    setAddonApi(api) {
        this.addonApi = { ...this.addonApi, ...api };
    }

    setConfig(conf) {
        this.addonConfig = conf;
    }

    subscribe(fn) {
        this.subscribers.push(fn);
        let stopped = false;

        const stop = () => {
            if (stopped) return;
            const index = this.subscribers.indexOf(fn);
            this.subscribers.splice(index, 1);
            stopped = true;
        };

        return stop;
    }

    fireSubscriptions(currentStore) {
        this.subscribers.forEach((fn) => {
            fn(currentStore);
        });
    }

    storeSave(context, store, keyPref) {
        const key = `${keyPref}::${context.kind}`;
        this.storesMap[key] = store;
    }

    storeCheckout(context, keyPref) {
        const key = `${keyPref}::${context.kind}`;
        const currentStore = this.storesMap[key] || initStore(
            this.defaultData,
            this.addonApi,
            this.setConfig,
        );
        this.fireSubscriptions(currentStore);
        return currentStore;
    }

    newStore() {
        return initStore(
            this.defaultData,
            this.addonApi,
            this.setConfig,
        );
    }

}

const addonManager = new AddonManager();

export { addonManager };

const decorStoresMap = {};
let isGlobalReload = false;

function getDecor(initData, keyPref, decorComposer, keyGen) {
    let key;
    let addonStoreCompose;
    let Decorator;
    let addonDecorator;

    let isHotReload = true;

    return (storyFn, context) => {
        key = keyGen(keyPref, context);
        if(!decorStoresMap[key]) {
            decorStoresMap[key] = decorStoresMap[key] || addonStoreCompose || addonManager.newStore();
            loggerHot.info(`Init store for ${key}`, decorStoresMap);
        }
        if (isHotReload) {
            loggerHot.log(`Fetch store for ${key}`, decorStoresMap);
            addonStoreCompose = decorStoresMap[key];
            Decorator = initComposer(addonStoreCompose);
            addonDecorator = decorComposer(addonStoreCompose);

            isHotReload = false;
        }
        isGlobalReload = true;

        // передавать функцию routes которая будет в качестве аргумента принимать хранилище.
        // в этой функции разработчик сам прописывает все нужные подписки на хранилище и создает структуру декораторов

        /* addonDecorator={() => <AddonDecorator story={storyFn()}/>} */
        /* story={storyFn()} */
        return (
          <div>
            <Decorator
              initData={initData}
              rootProps={{
                  enquiry: ENQ_SEND,
                  ID: getID(keyPref),
                  context,
              }}
              story={storyFn}
              addonRender={addonDecorator(storyFn, initData, 'rootProps')}
            />
            {/*addonDecorator*/}
          </div>);
    };
}


export function decorator(initData, pref) {
    const keyPref = pref || 'lc';
    logger.log('addDecorator', keyPref);
     // todo remove inside!!!
    const deco = getDecor(initData, keyPref, null);
    return deco;
}

const keyGenDiff = (keyPref, context) => `${keyPref}::${context.kind}`;

export function buidDecorator(initData, decorComposer, keyPref, keyGen = keyGenDiff) {
    const deco = getDecor(initData, keyPref, decorComposer, keyGen);
    return deco;
}
