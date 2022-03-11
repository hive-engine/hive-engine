import mitt from "mitt";

const emitter = mitt();

export { emitter };

export default {
  install: (app) => {
    app.config.globalProperties.$event = emitter;

    app.provide("eventBus", emitter);
  },
};
