var sketchflat = function() {

};






if (typeof module !== "undefined" && typeof module.exports == "object") {
  module.exports = sketchflat;
}

if (typeof window !== "undefined") {
  window.sketchflat = window.sketchflat || sketchflat;
}
