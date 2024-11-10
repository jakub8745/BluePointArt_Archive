// External method to rotate the camera to face a specific object by name
export function rotateToFaceObject(camera, controls, scene, objectName) {
    if (!objectName){
        objectName = "TextWielek";
    }
    let targetObject = null;
    scene.traverse((object) => {
        if (object.name === objectName) {
            targetObject = object;
        }
    });

    if (!targetObject) {
        console.error(`Object with name '${objectName}' not found in the scene.`);
        return;
    }

    // Set the controls target to the object's position
    controls.target.copy(targetObject.position);

    // Calculate the radius (distance) from the camera to the target
    const radius = camera.position.distanceTo(controls.target);

    // Calculate azimuthal and polar angles to face the object
    let azimuthalAngle = Math.atan2(
        camera.position.x - controls.target.x,
        camera.position.z - controls.target.z
    ) + Math.PI / 4; // +90 degrees in radians
    let polarAngle = Math.acos(
        (camera.position.y - controls.target.y) / radius
    );

    // Adjust camera position to face the target
    const newX = controls.target.x + radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);
    const newY = controls.target.y + radius * Math.cos(polarAngle);
    const newZ = controls.target.z + radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);

    // Set the new camera position
    camera.position.set(newX, newY, newZ);

    // Ensure the camera looks at the target and update controls
    camera.lookAt(controls.target);
    controls.update();
}

// Example of importing and using the method
// import { rotateToFaceObject } from './path/to/this/file.js';
// rotateToFaceObject(camera, controls, scene, 'TargetObjectName');
