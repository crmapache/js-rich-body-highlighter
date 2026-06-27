import type { BodyView } from '../data/types';

/** Source body image dimensions, in pixels. */
export const IMAGE_WIDTH_PX = 2048;
export const IMAGE_HEIGHT_PX = 3072;

/** Pixels -> millimeters at 96 DPI. 1px === this many viewBox units. */
export const PX2MM = 25.4 / 96; // ≈ 0.2645833

/**
 * SVG viewBox, in mm. These are the literal values of the Inkscape authoring
 * document (`0 0 541.87 812.80`) where masks are drawn, so masks land in the
 * exact same coordinate system. (2048 * PX2MM rounds to the same 541.87.)
 * Image and masks share this viewBox, so scaling the <svg> scales both together.
 */
export const VIEWBOX_WIDTH = 541.87;
export const VIEWBOX_HEIGHT = 812.8;

export const DEFAULT_COLOR = '#ff0000';
export const DEFAULT_BLEND_MODE = 'multiply';
export const DEFAULT_VIEW: BodyView = 'front';
export const DEFAULT_HOVER_INTENSITY = 35;

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';
