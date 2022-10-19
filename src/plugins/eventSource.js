class CustomEventSource {
  constructor(uri) {
    this.uri = uri;
    this.instance = null;
  }

  connect() {
    this.instance = new EventSource(this.uri);
  }

  getInstance() {
    if (!this.instance) {
      this.connect();
    }

    return this.instance;
  }
}

export default {
  install: (app, { url }) => {
    const eventSource = new CustomEventSource(url);

    app.provide('eventSource', eventSource);
  },
};
