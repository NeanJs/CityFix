<template>
  <div class="scene" aria-hidden="true">
    <div class="scene-base" />
    <div class="scene-grid" />
    <div class="scene-horizon" />
  </div>
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.scene-base {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 90% 55% at 12% 8%, rgba(125, 94, 48, 0.11), transparent 58%),
    radial-gradient(ellipse 70% 50% at 88% 18%, rgba(47, 61, 82, 0.09), transparent 55%),
    radial-gradient(ellipse 80% 45% at 50% 100%, rgba(125, 94, 48, 0.07), transparent 52%),
    linear-gradient(165deg, var(--bg-top) 0%, #ebe6df 48%, var(--bg-bottom) 100%);
}

.scene-grid {
  position: absolute;
  inset: 0;
  opacity: 0.55;
  background-image:
    linear-gradient(var(--scene-grid-lot) 1px, transparent 1px),
    linear-gradient(90deg, var(--scene-grid-lot) 1px, transparent 1px),
    linear-gradient(var(--scene-grid-street) 1px, transparent 1px),
    linear-gradient(90deg, var(--scene-grid-street) 1px, transparent 1px);
  background-size:
    var(--scene-lot-step) var(--scene-lot-step),
    var(--scene-lot-step) var(--scene-lot-step),
    var(--scene-block-step) var(--scene-block-step),
    var(--scene-block-step) var(--scene-block-step);
  mask-image:
    radial-gradient(ellipse 92% 78% at 50% 38%, transparent 62%, black 96%),
    linear-gradient(to top, black 0%, black 14%, transparent 58%);
  mask-composite: intersect;
  -webkit-mask-image:
    radial-gradient(ellipse 92% 78% at 50% 38%, transparent 62%, black 96%),
    linear-gradient(to top, black 0%, black 14%, transparent 58%);
  -webkit-mask-composite: source-in;
}

.scene-horizon {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: min(9vh, 4.25rem);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Crect fill='%232f3d52' fill-opacity='0.55' x='0' y='52' width='72' height='68'/%3E%3Crect fill='%232f3d52' fill-opacity='0.45' x='88' y='36' width='56' height='84'/%3E%3Crect fill='%237d5e30' fill-opacity='0.35' x='156' y='64' width='64' height='56'/%3E%3Crect fill='%232f3d52' fill-opacity='0.5' x='232' y='28' width='48' height='92'/%3E%3Crect fill='%232f3d52' fill-opacity='0.42' x='292' y='48' width='80' height='72'/%3E%3Crect fill='%232f3d52' fill-opacity='0.48' x='388' y='40' width='52' height='80'/%3E%3Crect fill='%237d5e30' fill-opacity='0.32' x='452' y='58' width='68' height='62'/%3E%3Crect fill='%232f3d52' fill-opacity='0.52' x='532' y='24' width='44' height='96'/%3E%3Crect fill='%232f3d52' fill-opacity='0.44' x='588' y='44' width='76' height='76'/%3E%3Crect fill='%232f3d52' fill-opacity='0.46' x='676' y='32' width='60' height='88'/%3E%3Crect fill='%237d5e30' fill-opacity='0.34' x='748' y='56' width='72' height='64'/%3E%3Crect fill='%232f3d52' fill-opacity='0.5' x='832' y='38' width='48' height='82'/%3E%3Crect fill='%232f3d52' fill-opacity='0.43' x='892' y='50' width='84' height='70'/%3E%3Crect fill='%232f3d52' fill-opacity='0.47' x='988' y='30' width='56' height='90'/%3E%3Crect fill='%232f3d52' fill-opacity='0.41' x='1056' y='46' width='64' height='74'/%3E%3Crect fill='%237d5e30' fill-opacity='0.33' x='1132' y='60' width='68' height='60'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: bottom center;
  opacity: 0.2;
  mask-image: linear-gradient(to top, black 0%, black 22%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 0%, black 22%, transparent 100%);
}
</style>
