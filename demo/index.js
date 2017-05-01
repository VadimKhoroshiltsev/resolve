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
import query from '../packages/resolve-query/dist';

import inventoryItemAggregate from './aggregates/inventoryItem';
import readModel from './read-model';

const setupMiddlewares = (app) => {
    app.use( bodyParser.json() );
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('views', './views')
    app.set('view engine', 'pug');
}

const app = express();

const eventStore = createStore({driver: esDriver({pathToFile: './storage/eventStore' })});
const bus = createBus({ driver: busDriver()});
const execute = commandHandler({ store: eventStore, bus, aggregate: inventoryItemAggregate });
const getList = query({ store: eventStore, bus, projection: readModel.InventoryItemListView });
const getDetails = query({ store: eventStore, bus, projection: readModel.InventoryItemDetailView });

setupMiddlewares(app);

app.get('/', function (req, res) {
    return getList()
        .then(inventoryItems => res.render('index', {
            items: Object.values(inventoryItems)
        }));
})

function postHandler(res, command) {
    execute(command)
        .then(() => res.redirect('/'))
        .catch(() => res.redirect('/'))
}

app.post('/', (req, res) => {
    const id = uuid.v4();
    const command = {
        commandName: 'create',
        aggregateId: id,
        name: req.body.name,
        inventoryItemId: id
    };

    postHandler(res, command);
})

app.get('/:id', (req, res) => {
    const id = req.params.id;

    return getDetails()
        .then(inventoryItems => res.render('details', {
            item: inventoryItems[id]
        }));
});

app.get('/changename/:id', (req, res) => {
    const id = req.params.id;

    return getDetails()
        .then(inventoryItems => res.render('changename', {
            item: inventoryItems[id]
        }));
});

app.post('/changename/:id', (req, res) => {
    postHandler(res, {
        aggregateId: req.params.id,
        commandName: 'changeName' ,
        newName: req.body.newName
    })
});

app.get('/checkin/:id', (req, res) => {
    const id = req.params.id;

    return getDetails()
        .then(inventoryItems => res.render('checkin', {
            item: inventoryItems[id]
        }));
});

app.post('/checkin/:id', (req, res) => {
    postHandler(res, {
        aggregateId: req.params.id,
        commandName: 'checkIn',
        count: Number.parseInt(req.body.count)
    })
});

app.get('/remove/:id', (req, res) => {
    const id = req.params.id;

    return getDetails()
        .then(inventoryItems => res.render('remove', {
            item: inventoryItems[id]
        }));
});

app.post('/remove/:id', (req, res) => {
    postHandler(res, {
        aggregateId: req.params.id,
        commandName: 'remove' ,
        count: Number.parseInt(req.body.count)
    })
});

app.get('/deactivate/:id', (req, res) => {
    const id = req.params.id;

    return getDetails()
        .then(inventoryItems => res.render('deactivate', {
            item: inventoryItems[id]
        }));
});

app.post('/deactivate/:id', (req, res) => {
    postHandler(res, {
        aggregateId: req.params.id,
        commandName: 'deactivate'
    })
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
