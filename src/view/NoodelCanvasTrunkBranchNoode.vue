<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div class="nd-noode-box" :class="noodeBoxClass">
		<transition name="nd-inspect-backdrop">
			<div
				class="nd-inspect-backdrop"
                :style="backdropStyle"
				v-if="noode.isInInspectMode"
			></div>
		</transition>
		<div
			ref="noode"
			class="nd-noode"
			:class="noodeClass"
			:style="noodeStyle"
			v-bind.prop="
				typeof noode.content === 'string'
					? { innerHTML: noode.content }
					: null
			"
			@pointerup="onPointerUp"
			@mouseup="onPointerUp"
			@touchend="onPointerUp"
		>
			<component
				v-if="
					this.noode.content && typeof this.noode.content === 'object'
				"
				:is="noode.content.component"
				v-bind="noode.content.props"
				v-on="noode.content.eventListeners"
			/>
		</div>
		<transition name="nd-child-indicator">
			<div
				v-if="showChildIndicator"
				class="nd-child-indicator"
				:class="childIndicatorClass"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && noode.hasOverflowTop"
				class="nd-overflow-indicator nd-overflow-indicator-top"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && noode.hasOverflowLeft"
				class="nd-overflow-indicator nd-overflow-indicator-left"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && noode.hasOverflowBottom"
				class="nd-overflow-indicator nd-overflow-indicator-bottom"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && noode.hasOverflowRight"
				class="nd-overflow-indicator nd-overflow-indicator-right"
			/>
		</transition>		
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
	import NoodeState from "../types/NoodeState";
	import { checkContentOverflow, updateNoodeSize } from "../controllers/noodel-align";
	import NoodelState from "../types/NoodelState";
	import { traverseAncestors } from "../controllers/noodel-traverse";
	import { getPath, getFocalHeight, getFocalWidth } from "../controllers/getters";
	import Vue, { PropType } from "vue";
	import Noode from "../main/Noode";
	import { findNoodeViewModel } from "../controllers/id-register";
	import { attachResizeSensor, detachResizeSensor } from '../controllers/resize-detect';

	export default Vue.extend({
		props: {
			noode: Object as PropType<NoodeState>,
			noodel: Object as PropType<NoodelState>,
		},

		mounted() {
			this.noode.boxEl = this.$el as HTMLDivElement;
			this.noode.el = this.$refs.noode as HTMLDivElement;

			// nextTick is required for vue's v-move effect to work
			Vue.nextTick(() => {
				// do initial size capture
				let noodeRect = this.noode.boxEl.getBoundingClientRect();

				updateNoodeSize(this.noodel, this.noode, noodeRect.height, noodeRect.width, true);
				checkContentOverflow(this.noodel, this.noode);

				attachResizeSensor(this.noodel, this.noode);

				// allows parent branch to fall back to display: none after first size update,
				// using nextTick to wait for parent branch size capture to finish first
				Vue.nextTick(() => {
					this.noode.parent.isBranchTransparent = false;
				});
			});
		},

		beforeDestroy() {
			detachResizeSensor(this.noode);

            // check fade flag and adjust absolute positioning as necessary
            if (this.noode['fade']) {
                delete this.noode['fade'];
                let orientation = this.noodel.options.orientation;
                let branchDirection = this.noodel.options.branchDirection;
                let offset = this.noode.branchRelativeOffset + "px";

                this.noode.boxEl.classList.remove("nd-noode-active");

                if (orientation === "ltr" || orientation === "rtl") {
                    this.noode.boxEl.style.width = "100%";

                    if (branchDirection === "normal") {
                        this.noode.boxEl.style.top = offset;
                    } else {
                        this.noode.boxEl.style.bottom = offset;
                    }
                } else {
                    this.noode.boxEl.style.height = "100%";

                    if (branchDirection === "normal") {
                        this.noode.boxEl.style.left = offset;
                    } else {
                        this.noode.boxEl.style.right = offset;
                    }
                }
            }
			
			this.noode.el = null;
			this.noode.boxEl = null;
		},

		methods: {
			onPointerUp() {
				if (this.noodel.pointerUpSrcNoode) return;
				this.noodel.pointerUpSrcNoode = this.noode;
				requestAnimationFrame(() => (this.noodel.pointerUpSrcNoode = null));
			},
		},

		computed: {
			noodeBoxClass(): {} {
				return {
					"nd-noode-box-active": this.noode.isActive,
				};
			},

			backdropStyle(): {} {
				return {
					width: `${this.noodel.containerWidth * 10}px`,
					height: `${this.noodel.containerHeight * 10}px`,
				};
			},

			noodeClass(): any[] {
				return [
					{
						"nd-noode-active": this.noode.isActive,
						"nd-noode-inspect": this.noode.isInInspectMode,
					},
					...this.noode.className,
				];
			},

			noodeStyle(): {} {
				return this.noode.style;
			},

			showChildIndicator(): boolean {
				let showOption =
					typeof this.noode.options.showChildIndicator === "boolean"
						? this.noode.options.showChildIndicator
						: this.noodel.options.showChildIndicators;

				return showOption && this.noode.children.length > 0;
			},

			childIndicatorClass(): {} {
				return {
					"nd-child-indicator-active": this.noode.isActive,
					"nd-child-indicator-expanded": this.noode.isBranchVisible,
				};
			},

			showOverflowIndicators(): boolean {
				return typeof this.noode.options.showOverflowIndicators === "boolean"
					? this.noode.options.showOverflowIndicators
					: this.noodel.options.showOverflowIndicators;
			}
		},
	});
</script>

<!---------------------------- STYLES ------------------------------>

<style>
	.nd-noode-box {
		box-sizing: border-box !important;
		margin: 0 !important; /* Must have no margin for size tracking to work properly */
		position: relative;
		display: flex !important; /* Prevents margin collapse */
		flex-direction: column;
		z-index: 1;
	}

	.nd-noode-box-active {
		z-index: 10;
	}

	.nd-inspect-backdrop {
		position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
		z-index: 1;
		background-color: rgba(0, 0, 0, 0.4);
		cursor: auto;
	}

	.nd-noode {
		margin: 0.2em 0.6em;
		padding: 1em;
		max-height: 600px;
		max-width: 800px;
		box-sizing: border-box;
		touch-action: none; /* Important as hammerjs will break on mobile without this */
		overflow: hidden;
		background-color: #e6e6e6;
		transition-property: background-color;
		transition-duration: 0.5s;
		transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
		z-index: 10;
	}

	.nd-noode-active {
		background-color: #ffffff;
	}

	.nd-noode-inspect {
		overflow: auto;
		user-select: text;
		-webkit-user-select: text;
		-khtml-user-select: text;
		-moz-user-select: text;
		-ms-user-select: text;
		cursor: auto;
		touch-action: auto;
		overscroll-behavior: none;
	}

	.nd-noode-leave-active {
		position: absolute;
		overflow: hidden;
        z-index: -1;
	}

	.nd-noode-enter,
	.nd-noode-leave-active {
		opacity: 0;
	}

	.nd-noode-enter-active,
	.nd-noode-leave-active {
		transition-property: opacity;
		transition-duration: 0.5s;
		transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.nd-noode-move {
		transition-property: opacity, transform;
		transition-duration: 0.5s;
		transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.nd-child-indicator {
		position: absolute;
		height: 1em;
		width: 0.7em;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		background-color: #e6e6e6;
		z-index: 100;
	}

	.nd-child-indicator-active {
		background-color: #ffffff;
	}

	.nd-child-indicator-expanded::after {
		content: "";
		position: absolute;
		left: 0.7em;
		bottom: 0;
		width: 0;
		height: 0;
		border-left: 0.5em solid #ffffff;
		border-top: 0.5em solid transparent;
		border-bottom: 0.5em solid transparent;
	}

	.nd-child-indicator-enter,
	.nd-child-indicator-leave-active {
		opacity: 0;
	}

	.nd-child-indicator-enter-active,
	.nd-child-indicator-leave-active {
		transition-property: opacity;
		transition-duration: 0.5s;
		transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.nd-inspect-backdrop-enter,
	.nd-inspect-backdrop-leave-active {
		opacity: 0;
	}

	.nd-inspect-backdrop-enter-active,
	.nd-inspect-backdrop-leave-active {
		transition-property: opacity;
		transition-duration: 0.5s;
		transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.nd-overflow-indicator {
		position: absolute;
		z-index: 50;
	}
</style>
