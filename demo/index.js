/* eslint-disable */

import express from 'express';
import bodyParser from 'body-parser';
import pug from 'pug';
import uuid from 'uuid';
import Immutable from 'seamless-immutable';

import createStore from '../packages/resolve-es/dist';
import esDriver from '../packages/resolve-es-file/dist';
import createBus from '../packages/resolve-bus/dist';
import busDriver from '../packages/resolve-bus-memory/dist';
import commandHandler from '../packages/resolve-command/dist';
import aggregates from './aggregates';

const setupMiddlewares = (app) => {
    app.use( bodyParser.json() );
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('views', './views')
    app.set('view engine', 'pug');
}

const taskProjection = () => {
    let state = Immutable({});
    return {
        initState: (bus, eventStore, aggregates) => {
            const aggregate = aggregates['TASK'];
            state = aggregate.__initialState();

            bus.onEvent(['TASK_CREATED', 'TASK_DELETED'], (event) => {
                state = aggregate.__applyEvent(state, event);
            });

            eventStore.loadEventsByTypes(['TASK_CREATED', 'TASK_DELETED'], (event) => {
                state = aggregate.__applyEvent(state, event);
            });
        },

        getTasks: () => state.tasks
    }
}

const app = express();

const eventStore = createStore({driver: esDriver({pathToFile: './storage/eventStore' })});
const bus = createBus({ driver: busDriver()});
const execute = commandHandler({ store: eventStore, bus, aggregates });

const tasks = taskProjection();

setupMiddlewares(app);
tasks.initState(bus, eventStore, aggregates);

app.get('/', function (req, res) {
    res.render('index', {
        tasks: tasks.getTasks()
    });
})

app.post('/', (req, res) => {
    const command = {
        __aggregateName: 'TASK',
        __commandName: req.body.command
    };

    switch(req.body.command) {
        case 'CREATE': {
            Object.assign(command, {
                __aggregateId: uuid.v4(),
                name: req.body.name
            })
            break;
        }
        case 'DELETE': {
            Object.assign(command, {
                __aggregateId: req.body.id
            })
            break;
        }
    }

    execute(command)
        .then(() => res.redirect('/'))
        .catch(() => res.redirect('/'))
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
