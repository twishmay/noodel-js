import Noode from '../main/Noode';

/**
 * Options for an individual noode.
 */
export default interface NoodeOptions {
    /**
     * If set to a boolean, will override the global skipResizeDetection option
     * for this specific noode. Default null.
     */
    skipResizeDetection?: boolean | null;
    /**
     * If set to a boolean, will override the global showChildIndicators option for
     * this specific noode. Default null.
     */
    showChildIndicator?: boolean | null;
    /**
     * If set to a boolean, will override the global showBranchColumns option for
     * the child branch of this specific noode. Default null.
     */
    showBranchColumn?: boolean | null;
    /**
     * Handler called whenever this noode entered focus. Will be called once after noodel creation
     * if this is the focal noode.
     * @param self the current focal noode (i.e. this noode)
     * @param prev the previous focal noode, null on initial call
     */
    onEnterFocus?: (self: Noode, prev: Noode) => any | null;
    /**
     * Handler called whenever this noode exited focus.
     * @param self the previous focal noode (i.e. this noode)
     * @param current the current focal noode
     */
    onExitFocus?: (self: Noode, current: Noode) => any | null;
    /**
     * Handler called whenever this noode's child branch entered focus. Will be called once after noodel creation
     * if this is the focal parent.
     * @param self the current focal parent (i.e. this noode)
     * @param prev the previous focal parent, null on initial call
     */
    onChildrenEnterFocus?:  (self: Noode, prev: Noode) => any | null;
    /**
     * Handler called whenever this noode's child branch exited focus.
     * @param self the previous focal parent (i.e. this noode)
     * @param current the current focal parent
     */
    onChildrenExitFocus?:  (self: Noode, current: Noode) => any | null;
} 