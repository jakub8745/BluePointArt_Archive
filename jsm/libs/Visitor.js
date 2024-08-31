import { Mesh, Line3, Vector3, Raycaster, MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export default class Visitor extends Mesh {
  constructor(scene) {
    const geometry = new RoundedBoxGeometry(0.2, 0.2, 0.2, 10, 0.5);
    const material = new MeshStandardMaterial();

    super(geometry, material);

    this.name = "visitor";
    this.capsuleInfo = {
      radius: 0.2,
      segment: new Line3(
        new Vector3(),
        new Vector3(0, 0.1, 0.0)
      ),
    };

    this.castShadow = false;
    this.material.wireframe = true;
    this.visible = false;

    this.scene = scene;
    this.scene.add(this);

    this.raycaster = new Raycaster();
    this.downVector = new Vector3(0, -1, 0);
    this.intersectedObjects = [];
  }

  checkLocation() {
    this.raycaster.firstHitOnly = true;
    this.raycaster.set(this.position, this.downVector);
    const intersectedObjects = this.raycaster.intersectObjects(this.scene.children, true);

    return intersectedObjects.find(({ object }) => {
      const type = object.userData.type;
      return type === "visitorLocation" || type === "Room";
    })?.object;
  }

  moveToScene(newScene) {
    if (this.scene) {
      this.scene.remove(this);
    }

    this.scene = newScene;
    this.scene.add(this);
  }
}
