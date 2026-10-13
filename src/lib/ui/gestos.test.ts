import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DISTANCIA_FLICK,
  DISTANCIA_MINIMA,
  RATIO_EJE,
  decidirRevelado,
  ejeDelGesto,
  limitarArrastre,
  swipeHorizontal,
  vieneDelBorde,
  type Punto,
} from "./gestos.ts";

const punto = (x: number, y: number, t: number): Punto => ({ x, y, t });

describe("ejeDelGesto", () => {
  it("llama horizontal al avance lateral claro", () => {
    assert.equal(ejeDelGesto(punto(0, 0, 0), punto(60, 20, 40)), "horizontal");
  });

  it("llama vertical al avance que gana hacia abajo", () => {
    assert.equal(ejeDelGesto(punto(0, 0, 0), punto(10, 70, 40)), "vertical");
  });

  it("no decide con ruido ni con diagonales ambiguas", () => {
    assert.equal(ejeDelGesto(punto(0, 0, 0), punto(3, 2, 10)), "indefinido");
    assert.equal(ejeDelGesto(punto(0, 0, 0), punto(50, 48, 40)), "indefinido");
  });

  it("usa el factor 1,2 como frontera", () => {
    const limite = 40 * RATIO_EJE;
    assert.equal(ejeDelGesto(punto(0, 0, 0), punto(limite, 40, 30)), "horizontal");
    assert.equal(ejeDelGesto(punto(0, 0, 0), punto(limite - 2, 40, 30)), "indefinido");
  });
});

describe("swipeHorizontal", () => {
  it("acepta un arrastre largo hacia la izquierda", () => {
    const gesto = swipeHorizontal(punto(200, 100, 0), punto(200 - DISTANCIA_MINIMA, 108, 260));
    assert.equal(gesto.valido, true);
    assert.equal(gesto.direccion, -1);
  });

  it("acepta un flick corto pero rápido", () => {
    const gesto = swipeHorizontal(punto(200, 100, 0), punto(200 - DISTANCIA_FLICK - 4, 102, 30));
    assert.equal(gesto.valido, true);
    assert.ok(gesto.velocidad > 0.5);
  });

  it("rechaza un recorrido corto y lento", () => {
    assert.equal(swipeHorizontal(punto(0, 0, 0), punto(-30, 4, 900)).valido, false);
  });

  it("rechaza el scroll vertical aunque sea largo y rápido", () => {
    assert.equal(swipeHorizontal(punto(0, 0, 0), punto(-12, 320, 300)).valido, false);
  });

  it("marca la dirección derecha al volver", () => {
    assert.equal(swipeHorizontal(punto(0, 0, 0), punto(90, 6, 200)).direccion, 1);
  });
});

describe("limitarArrastre", () => {
  it("topea en el ancho del panel y nunca lo rebasa", () => {
    assert.equal(limitarArrastre(-400, 140), -140);
    assert.equal(limitarArrastre(-140, 140), -140);
  });

  it("ofrece goma breve hacia la derecha", () => {
    assert.ok(limitarArrastre(80, 140) > 0);
    assert.ok(limitarArrastre(80, 140) <= 140 * 0.1);
    assert.equal(limitarArrastre(0, 140), 0);
  });
});

describe("decidirRevelado", () => {
  it("abre al pasar del umbral del panel", () => {
    assert.equal(decidirRevelado(-70, 140, 0.1), true);
    assert.equal(decidirRevelado(-62, 140, 0.1), false);
  });

  it("un gesto rápido manda sobre la posición", () => {
    assert.equal(decidirRevelado(-24, 140, 0.9), true);
    assert.equal(decidirRevelado(24, 140, 0.9), false);
  });

  it("sin panel no hay nada que revelar", () => {
    assert.equal(decidirRevelado(-50, 0, 0.4), false);
  });
});

describe("vieneDelBorde", () => {
  it("reserva los bordes para el navegador", () => {
    assert.equal(vieneDelBorde(8, 390), true);
    assert.equal(vieneDelBorde(386, 390), true);
    assert.equal(vieneDelBorde(190, 390), false);
  });
});
