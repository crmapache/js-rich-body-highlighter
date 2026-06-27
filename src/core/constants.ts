import type { BodyView, Gender, Theme } from '../data/types';

/** Pixels -> millimeters at 96 DPI. 1px === this many viewBox units. */
export const PX2MM = 25.4 / 96; // ≈ 0.2645833

/**
 * SVG viewBox, in mm. These are the literal values of the Inkscape authoring
 * document (`0 0 541.87 812.80`, a 2048×3072 canvas) where masks are drawn, so
 * masks land in the exact same coordinate system. Bodies ship at a lower
 * resolution (2:3, 1365×2048) but the <image> is scaled to fill this viewBox, so
 * pixel size is irrelevant. Image and masks share the viewBox, so scaling the
 * <svg> scales both together.
 */
export const VIEWBOX_WIDTH = 541.87;
export const VIEWBOX_HEIGHT = 812.8;

export const DEFAULT_COLOR = '#ff0000';
export const DEFAULT_BLEND_MODE = 'multiply';
export const DEFAULT_VIEW: BodyView = 'front';
export const DEFAULT_GENDER: Gender = 'male';
export const DEFAULT_THEME: Theme = 'light';
export const DEFAULT_HOVER_INTENSITY = 35;

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';
