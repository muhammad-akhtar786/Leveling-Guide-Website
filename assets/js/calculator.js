// Leveling Guide — self-leveling concrete calculators
// All math is estimation-only; real coverage varies by manufacturer.

function toFeet(value, unit) {
  return unit === 'm' ? value * 3.28084 : value;
}
function toInches(value, unit) {
  // depth units: in, mm
  return unit === 'mm' ? value / 25.4 : value;
}

function initMaterialCalculator() {
  var form = document.getElementById('material-calc-form');
  if (!form) return;
  var errorBox = document.getElementById('material-calc-error');
  var results = document.getElementById('material-calc-results');
  var status = form.querySelector('.calc-status');

  function updateResults() {
    errorBox.classList.remove('is-visible');
    results.classList.remove('is-visible');

    var lengthUnit = form.elements.namedItem('dimUnit').value;
    var length = parseFloat(form.elements.namedItem('length').value);
    var width = parseFloat(form.elements.namedItem('width').value);
    var depthUnit = form.elements.namedItem('depthUnit').value;
    var depth = parseFloat(form.elements.namedItem('depth').value);
    var bagSize = parseFloat(form.elements.namedItem('bagSize').value);
    var coveragePerBag = parseFloat(form.elements.namedItem('coverage').value);
    var wastePct = parseFloat(form.elements.namedItem('waste').value);

    var invalid =
      isNaN(length) || isNaN(width) || isNaN(depth) || isNaN(bagSize) || isNaN(coveragePerBag) ||
      length <= 0 || width <= 0 || depth <= 0 || bagSize <= 0 || coveragePerBag <= 0 ||
      length > 10000 || width > 10000 || toInches(depth, depthUnit) > 12 || !Number.isFinite(wastePct) || wastePct < 0 || wastePct > 100;

    if (invalid) {
      errorBox.textContent = 'Please enter positive, realistic numbers (depth up to 12 in, area up to 10,000 ft/m per side). Check for empty or negative fields.';
      errorBox.classList.add('is-visible');
      if (status) {
        status.classList.remove('is-visible');
      }
      return;
    }

    var lengthFt = toFeet(length, lengthUnit);
    var widthFt = toFeet(width, lengthUnit);
    var depthIn = toInches(depth, depthUnit);

    var areaSqFt = lengthFt * widthFt;
    var referenceDepthIn = 0.125;
    var effectiveCoverage = coveragePerBag * (referenceDepthIn / depthIn);
    var bagsNeeded = areaSqFt / effectiveCoverage;
    var bagsWithWaste = bagsNeeded * (1 + wastePct / 100);
    var bagsRounded = Math.ceil(bagsWithWaste);
    var totalWeightLb = bagsRounded * bagSize;
    var volumeCuFt = areaSqFt * (depthIn / 12);

    document.getElementById('res-area').textContent = areaSqFt.toFixed(1) + ' sq ft';
    document.getElementById('res-volume').textContent = volumeCuFt.toFixed(2) + ' cu ft';
    document.getElementById('res-bags-exact').textContent = bagsWithWaste.toFixed(2);
    document.getElementById('res-bags').textContent = bagsRounded + ' bags';
    document.getElementById('res-weight').textContent = totalWeightLb.toLocaleString() + ' lb';

    results.classList.add('is-visible');
    if (status) {
      status.textContent = 'Updated';
      status.classList.add('is-visible');
      window.clearTimeout(status._timer);
      status._timer = window.setTimeout(function () {
        status.classList.remove('is-visible');
      }, 1200);
    }
    results.setAttribute('tabindex', '-1');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    updateResults();
    if (results.classList.contains('is-visible')) results.focus({ preventScroll: false });
  });

  ['input', 'change'].forEach(function (eventName) {
    form.addEventListener(eventName, function () {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updateResults();
        return;
      }
      clearTimeout(form._debounceTimer);
      form._debounceTimer = setTimeout(updateResults, 180);
    });
  });

  form.addEventListener('reset', function () {
    clearTimeout(form._debounceTimer);
    errorBox.classList.remove('is-visible');
    results.classList.remove('is-visible');
    if (status) {
      status.classList.remove('is-visible');
    }
  });
}

function initCostCalculator() {
  var form = document.getElementById('cost-calc-form');
  if (!form) return;
  var errorBox = document.getElementById('cost-calc-error');
  var results = document.getElementById('cost-calc-results');
  var status = form.querySelector('.calc-status');

  function updateResults() {
    errorBox.classList.remove('is-visible');
    results.classList.remove('is-visible');

    var area = parseFloat(form.elements.namedItem('area').value);
    var depth = parseFloat(form.elements.namedItem('depth').value);
    var coveragePerBag = parseFloat(form.elements.namedItem('coverage').value);
    var pricePerBag = parseFloat(form.elements.namedItem('price').value);
    var wastePct = parseFloat(form.elements.namedItem('waste').value);

    var invalid =
      isNaN(area) || isNaN(depth) || isNaN(coveragePerBag) || isNaN(pricePerBag) ||
      area <= 0 || depth <= 0 || coveragePerBag <= 0 || pricePerBag <= 0 ||
      area > 200000 || depth > 12 || !Number.isFinite(wastePct) || wastePct < 0 || wastePct > 100;

    if (invalid) {
      errorBox.textContent = 'Please enter positive, realistic numbers for area, depth, coverage, and price.';
      errorBox.classList.add('is-visible');
      if (status) {
        status.classList.remove('is-visible');
      }
      return;
    }

    var referenceDepthIn = 0.125;
    var effectiveCoverage = coveragePerBag * (referenceDepthIn / depth);
    var bagsNeeded = area / effectiveCoverage;
    var bagsWithWaste = bagsNeeded * (1 + wastePct / 100);
    var bagsRounded = Math.ceil(bagsWithWaste);
    var baseCost = bagsNeeded * pricePerBag;
    var totalCost = bagsRounded * pricePerBag;
    var wasteCost = totalCost - baseCost;

    document.getElementById('cost-res-bags').textContent = bagsRounded + ' bags';
    document.getElementById('cost-res-base').textContent = '$' + baseCost.toFixed(2);
    document.getElementById('cost-res-waste').textContent = '$' + wasteCost.toFixed(2);
    document.getElementById('cost-res-total').textContent = '$' + totalCost.toFixed(2);

    results.classList.add('is-visible');
    if (status) {
      status.textContent = 'Updated';
      status.classList.add('is-visible');
      window.clearTimeout(status._timer);
      status._timer = window.setTimeout(function () {
        status.classList.remove('is-visible');
      }, 1200);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    updateResults();
  });

  ['input', 'change'].forEach(function (eventName) {
    form.addEventListener(eventName, function () {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updateResults();
        return;
      }
      clearTimeout(form._debounceTimer);
      form._debounceTimer = setTimeout(updateResults, 180);
    });
  });

  form.addEventListener('reset', function () {
    clearTimeout(form._debounceTimer);
    errorBox.classList.remove('is-visible');
    results.classList.remove('is-visible');
    if (status) {
      status.classList.remove('is-visible');
    }
  });
}

function initBagCoverageCalculator() {
  var form = document.getElementById('bag-coverage-form');
  if (!form) return;
  var errorBox = document.getElementById('bag-coverage-error');
  var results = document.getElementById('bag-coverage-results');
  var status = form.querySelector('.calc-status');

  function updateResults() {
    errorBox.classList.remove('is-visible');
    results.classList.remove('is-visible');

    var bags = parseFloat(form.elements.namedItem('bags').value);
    var coveragePerBag = parseFloat(form.elements.namedItem('coverage').value);
    var depth = parseFloat(form.elements.namedItem('depth').value);

    var invalid =
      isNaN(bags) || isNaN(coveragePerBag) || isNaN(depth) ||
      bags <= 0 || coveragePerBag <= 0 || depth <= 0 ||
      bags > 100000 || depth > 12;

    if (invalid) {
      errorBox.textContent = 'Please enter positive, realistic numbers for bags, coverage, and depth.';
      errorBox.classList.add('is-visible');
      if (status) {
        status.classList.remove('is-visible');
      }
      return;
    }

    var referenceDepthIn = 0.125;
    var coverageAtDepth = coveragePerBag * (referenceDepthIn / depth);
    var totalArea = coverageAtDepth * bags;

    document.getElementById('bc-res-coverage-per-bag').textContent = coverageAtDepth.toFixed(1) + ' sq ft';
    document.getElementById('bc-res-total-area').textContent = totalArea.toFixed(1) + ' sq ft';

    results.classList.add('is-visible');
    if (status) {
      status.textContent = 'Updated';
      status.classList.add('is-visible');
      window.clearTimeout(status._timer);
      status._timer = window.setTimeout(function () {
        status.classList.remove('is-visible');
      }, 1200);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    updateResults();
  });

  ['input', 'change'].forEach(function (eventName) {
    form.addEventListener(eventName, function () {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updateResults();
        return;
      }
      clearTimeout(form._debounceTimer);
      form._debounceTimer = setTimeout(updateResults, 180);
    });
  });

  form.addEventListener('reset', function () {
    clearTimeout(form._debounceTimer);
    errorBox.classList.remove('is-visible');
    results.classList.remove('is-visible');
    if (status) {
      status.classList.remove('is-visible');
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initMaterialCalculator();
  initCostCalculator();
  initBagCoverageCalculator();
});
