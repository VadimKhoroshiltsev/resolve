export default function ({ driver }) {
    const eventHandlersMap = new Map();

    function trigger(event) {
        const handlers = eventHandlersMap.get(event.__type) || [];
        handlers.forEach(handler => handler(event));
    }

    driver.subscribe(trigger);

    return {
        emitEvent: event => driver.publish(event),
        onEvent: (eventTypes, callback) => {
            eventTypes.forEach((eventType) => {
                const handlers = eventHandlersMap.get(eventType) || [];
                handlers.push(callback);
                eventHandlersMap.set(eventType, handlers);
            });

            return () => {
                eventTypes.forEach((eventType) => {
                    const handlers = eventHandlersMap
                        .get(eventType)
                        .filter(item => item !== callback);
                    eventHandlersMap.set(eventType, handlers);
                });
            };
        }
    };
}
