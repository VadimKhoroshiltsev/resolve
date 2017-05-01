import Immutable from 'seamless-immutable';

export default {
    handlers: {
        InventoryItemCreated: (_, event) =>
            Immutable({ _id: event._id, _activated: true }),

        InventoryItemDeactivated: state =>
            state.setIn(['_activated'], false)
    },

    commands: {
        create: (state, { inventoryItemId, name }) => ({
            _id: inventoryItemId,
            __type: 'InventoryItemCreated',
            name
        }),

        changeName: (state, { newName }) => {
            if (!newName) throw new Error('newName');

            return {
                _id: state._id,
                __type: 'InventoryItemRenamed',
                name: newName
            };
        },

        remove: (state, { count }) => {
            if (count <= 0) throw new Error('cant remove negative count from inventory');

            return {
                _id: state._id,
                __type: 'ItemsRemovedFromInventory',
                count
            };
        },

        checkIn: (state, { count }) => {
            if (count <= 0) throw new Error('must have a count greater than 0 to add to inventory');
            return {
                _id: state._id,
                __type: 'ItemsCheckedInToInventory',
                count
            };
        },

        deactivate: (state) => {
            if (!state._activated) throw new Error('already deactivated');

            return {
                _id: state._id,
                __type: 'InventoryItemDeactivated'
            };
        }
    }
};
