import Immutable from 'seamless-immutable';

export default {
    INVENTORY_ITEM: {
        changeName: (aggregate, args) => ({
            __aggregateId: aggregate.__aggregateId,
            __type:
        })
    }
}

export default {
    TASK: {
        __initialState: () => Immutable({
            tasks: []
        }),

        __applyEvent: (state, event) => {
            switch (event.__type) {
                case 'TASK_CREATED':
                    return state.setIn(['tasks'], state.tasks.concat({
                        id: event.__aggregateId,
                        name: event.name
                    }));
                case 'TASK_DELETED':
                    return state.setIn(['tasks'], state.tasks.filter(
                        x => x.id !== event.__aggregateId)
                    );
                default:
                    return state;
            }
        },

        CREATE: (state, args) => ({
            ...args,
            __type: 'TASK_CREATED'
        }),

        DELETE: (state, args) => ({
            ...args,
            __type: 'TASK_DELETED'
        })
    }
};
