import { expect } from 'chai';
import sinon from 'sinon';

import createStore from '../../resolve-es/src';
import memoryEsDriver from '../../resolve-es-memory/src';

import createBus from '../../resolve-bus/src';
import memoryBusDriver from '../../resolve-bus-memory/src';

import commandHandler from '../src';

describe('command', () => {
    let store;
    let bus;
    let execute;
    let aggregate;
    let testCommand;
    let testEvent;

    beforeEach(() => {
        testCommand = {
            aggregateId: 'test-id',
            commandName: 'CREATE',
            name: 'Vasiliy'
        };

        testEvent = {
            __aggregateId: 'test-id',
            __type: 'USER_CREATED',
            name: 'Vasiliy'
        };

        aggregate = {
            commands: {
                CREATE: () => testEvent
            }
        };

        store = createStore({ driver: memoryEsDriver() });
        bus = createBus({ driver: memoryBusDriver() });
        execute = commandHandler({ store, bus, aggregate });
    });

    it('should save and publish event', () => {
        const eventHandlerSpy = sinon.spy();
        bus.onEvent(['USER_CREATED'], eventHandlerSpy);

        return execute(testCommand).then(() => {
            expect(eventHandlerSpy.callCount).to.be.equal(1);
            expect(eventHandlerSpy.lastCall.args[0])
                .to.be.deep.equal(testEvent);

            const storedEvents = [];
            return store.loadEventsByAggregateId('test-id', event => storedEvents.push(event))
                .then(() => expect(storedEvents)
                    .to.be.deep.equal([testEvent])
                );
        });
    });

    it('should reject event in case of commandName absense', () => {
        delete testCommand.commandName;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('commandName argument is required'));
    });

    it('should reject event in case of aggregateId absense', () => {
        delete testCommand.aggregateId;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('aggregateId argument is required'));
    });

    it('should pass initialState and args to command handler', () => {
        const createHandlerSpy = sinon.spy(() => testEvent);

        aggregate.commands.CREATE = createHandlerSpy;

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                {},
                testCommand
            ]);
        });
    });

    it('should get custom initialState and args to command handler', () => {
        const createHandlerSpy = sinon.spy(() => testEvent);

        aggregate.commands.CREATE = createHandlerSpy;
        aggregate.initialState = () => ({
            name: 'Initial name'
        });

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: 'Initial name' },
                testCommand
            ]);
        });
    });

    it('should pass initialState and args to command handler', () => {
        const events = [
            { __aggregateId: 'test-id', __type: 'USER_CREATED', name: 'User1' },
            { __aggregateId: 'test-id-2', __type: 'USER_CREATED' },
            { __aggregateId: 'test-id', __type: 'USER_UPDATED', name: 'User1', newName: 'User2' }
        ];

        store = createStore({ driver: memoryEsDriver(events) });

        const createHandlerSpy = sinon.spy(() => testEvent);

        const userCreatedHandlerSpy = sinon.spy((state, event) => ({
            name: event.name
        }));

        const userUpdatedHandlerSpy = sinon.spy((state, event) => Object.assign(
            {},
            state,
            { name: event.newName }
        ));

        aggregate = {
            handlers: {
                USER_CREATED: userCreatedHandlerSpy,
                USER_UPDATED: userUpdatedHandlerSpy
            },
            commands: {
                CREATE: createHandlerSpy
            }
        };

        execute = commandHandler({ store, bus, aggregate });

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: 'User2' },
                testCommand
            ]);

            expect(userCreatedHandlerSpy.callCount).to.be.equal(1);
            expect(userCreatedHandlerSpy.lastCall.args).to.be.deep.equal([
                {},
                events[0]
            ]);

            expect(userUpdatedHandlerSpy.callCount).to.be.equal(1);
            expect(userUpdatedHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: 'User1' },
                events[2]
            ]);
        });
    });

    it('should return event without additional fields', () => {
        const createHandlerSpy = sinon.spy((state, args) => ({
            __type: 'TEST_HANDLED',
            name: args.name
        }));

        Object.assign(aggregate, {
            handlers: {
                TEST_HANDLED: (state, event) => ({
                    name: event.name
                })
            },
            commands: {
                CREATE: createHandlerSpy
            }
        });

        return execute(testCommand)
            .then(() => execute(testCommand))
            .then(() => {
                expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: testCommand.name },
                    testCommand
                ]);
            });
    });
});
