import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { usePlayerControls } from '../utils/helper.js';
import * as THREE from 'three';

const BaseCharacter = (props) => {
  const controlsRef = useRef();
  const [updateCallback, setUpdateCallback] = useState(null);

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();
  const speed = new THREE.Vector3();
  const SPEED = 5;

  const { camera } = useThree();

  // Register the update event and clean up
  useEffect(() => {
    const onControlsChange = (val) => {
      const { position } = val.target.object;
      const { id } = props.socket;

      const posArray = [];

      position.toArray(posArray);

      props.socket.emit('move', {
        id,
        position: posArray,
      });
    };

    if (controlsRef.current) {
      setUpdateCallback(controlsRef.current.addEventListener('change', onControlsChange));
    }

    // Dispose
    return () => {
      if (updateCallback && controlsRef.current) controlsRef.current.removeEventListener('change', onControlsChange);
    };
  }, [props.socket]);

  const [ref, api] = useSphere((index) => ({
    mass: 1,
    type: 'Dynamic',

    position: [0, 10, 0],
    ...props,
  }));

  const { forward, backward, left, right, jump } = usePlayerControls();
  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), []);

  useFrame((state) => {
    ref.current.getWorldPosition(camera.position);
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED).applyEuler(camera.rotation);
    speed.fromArray(velocity.current);

    api.velocity.set(direction.x, velocity.current[1], direction.z);
    if (jump && Math.abs(velocity.current[1].toFixed(2)) < 0.05) api.velocity.set(velocity.current[0], 5, velocity.current[2]);
  });

  return (
    <group>
      <mesh castShadow position={props.position} ref={ref}>
        <sphereGeometry args={props.args} />
        <meshStandardMaterial color="#FFFF00" />
      </mesh>
    </group>
  );
};

export default BaseCharacter;
