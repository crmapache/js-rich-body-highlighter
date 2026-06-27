import type { BodyView, Gender, Theme } from '../data/types';

/** Pixels -> millimeters at 96 DPI. 1px === this many viewBox units. */
export const PX2MM = 25.4 / 96; // ≈ 0.2645833

/** Source body image dimensions, in pixels (what masks are authored over). */
export const BODY_WIDTH_PX = 1365;
export const BODY_HEIGHT_PX = 2048;

/**
 * SVG viewBox, in mm. Masks are traced in Inkscape over the real body image
 * (1365×2048) at 96 DPI, so the authoring document — and therefore this viewBox —
 * is the body in mm (px × PX2MM). The <image> fills it 1:1, so a traced path
 * drops in at its native coordinates. Image and masks share the viewBox, so
 * scaling the <svg> scales both together.
 */
export const VIEWBOX_WIDTH = BODY_WIDTH_PX * PX2MM; // 361.15625
export const VIEWBOX_HEIGHT = BODY_HEIGHT_PX * PX2MM; // 541.86667

export const DEFAULT_COLOR = '#ff0000';
export const DEFAULT_BLEND_MODE = 'multiply';
export const DEFAULT_VIEW: BodyView = 'front';
export const DEFAULT_GENDER: Gender = 'male';
export const DEFAULT_THEME: Theme = 'light';
export const DEFAULT_HOVER_INTENSITY = 35;

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';
