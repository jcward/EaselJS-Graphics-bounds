# EaselJS-Graphics-bounds
A simplistic implementation for calculating the bounds of an EaselJS Grahpics object.

Tested against the current git version (631cdff, roughly == 0.8.2) of Graphics.js:
https://rawgit.com/CreateJS/EaselJS/631cdffb85eff9413dab43b4676f059b4232d291/src/easeljs/display/Graphics.js

**Screenshot of visual_test.html:**

![selection_999 219](https://cloud.githubusercontent.com/assets/2192439/21940783/1aeb8d36-d983-11e6-8e50-33e8349cc85e.png)

Why?
----

For those of us who like the Flash Graphics API, EaselJS's `Grahpics.js` is a nice and simple, standalone, lightweight (<4kb min+gzip) solution for drawing onto HTML Canvas elements.

Implemented
-----------
- Lines and curves (quadratic and bezier)
- Line width (assuming round caps)
- Rectangles, circles, ellipses

Not implemented / accounted for
-------------------------------
- Miter (i.e. out-cropping on acute angles), joints settings ignored
- drawArc, arcTo (I simply didn't need it, feel free to contribute)
- Maybe something else I missed
- See the TODOs in code

I implemented all I needed for my simple project. Feel free to submit PRs.

I think miter and non-round caps will require taking into account angles from one line segment to the next. Not impossible, but I didn't need it.
