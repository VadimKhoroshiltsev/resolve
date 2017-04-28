import Immutable from 'seamless-immutable';

export default {
    InventoryItemListView: {
        initialState: Immutable({}),

        handlers: {
            InventoryItemCreated: (state, event) =>
                state.setIn([event.__aggregateId], {
                    _id: event._id,
                    name: event.name
                }),

            InventoryItemRenamed: (state, event) =>
                state.setIn([event.__aggregateId, 'name'], event.name),

            InventoryItemDeactivated: (state, event) =>
                state.without(event.__aggregateId)
        }
    },

    InventoryItemDetailView: {
        initialState: Immutable({}),

        handlers: {
            InventoryItemCreated: (state, event) =>
                state.setIn([event.__aggregateId], {
                    _id: event._id,
                    name: event.name,
                    count: 0
                }),

            InventoryItemRenamed: (state, event) =>
                state.setIn([event.__aggregateId, 'name'], event.name),

            ItemsRemovedFromInventory: (state, event) =>
                state.setIn([event.__aggregateId, 'count'], state[event.__aggregateId].count - event.count),

            ItemsCheckedInToInventory: (state, event) =>
                state.setIn([event.__aggregateId, 'count'], state[event.__aggregateId].count + event.count),

            InventoryItemDeactivated: (state, event) =>
                state.without(event.__aggregateId)
        }
    }
};
