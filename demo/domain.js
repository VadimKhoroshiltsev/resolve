import Immutable from 'seamless-immutable';

export default {
    inventoryItem: {
        __applyEvent: (state, event) => {
            switch (event.type) {
                case 'InventoryItemCreated':
                    return Immutable({ _id: event._id, _activated: true });
                case 'InventoryItemDeactivated':
                    return state.setIn(['_activated'], false);
                default:
                    return state;
            }
        },

        create: (state, { inventoryItemId, name }) => ({
            _id: inventoryItemId,
            type: 'InventoryItemCreated',
            name
        }),

        changeName: (state, { newName }) => {
            if (!newName) throw new Error('newName');

            return {
                _id: state._id,
                type: 'InventoryItemRenamed',
                name: newName
            };
        },

        remove: (state, { count }) => {
            if (count <= 0) throw new Error('cant remove negative count from inventory');

            return {
                _id: state._id,
                type: 'ItemsRemovedFromInventory',
                count
            };
        },

        checkIn: (state, { count }) => {
            if (count <= 0) throw new Error('must have a count greater than 0 to add to inventory');

            return {
                _id: state._id,
                type: 'ItemsCheckedInToInventory',
                count
            };
        },

        deactivate: (state) => {
            if (!state._activated) throw new Error('already deactivated');

            return {
                _id: state._id,
                type: 'InventoryItemDeactivated'
            };
        }
    }
};
