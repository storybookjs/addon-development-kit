import { register } from '../src';
import api from './api';
import config from './config';
import defaultData from './defaultData';
import panelRoutes from './panelRoutes';

const panelSettings = {
    initData: 'ADK Panel',
    defaultData,
    api,
    render: panelRoutes,
    ...config,
};

register(panelSettings);
