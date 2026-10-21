/** Records every disconnect of an ImmediateResizeObserver, so tests can check the observer is stopped. */
export const disconnectResizeObserver = jest.fn()

/** Receives the elements a resize observer reports. */
type ResizeCallback = (entries: Pick<ResizeObserverEntry, 'target'>[]) => void

/**
 * Stand-in for resize-observer-polyfill, whose observe() does nothing under jsdom: it reports each element as soon as
 * it is observed, as a browser does after the first layout.
 */
export class ImmediateResizeObserver {
  /** Receives the observed elements. */
  private readonly callback: ResizeCallback

  constructor(callback: ResizeCallback) {
    this.callback = callback
  }

  /** Reports the element right away. */
  observe = (target: Element) => {
    this.callback([{ target }])
  }

  /** Stops reporting every observed element. */
  disconnect = disconnectResizeObserver
}
