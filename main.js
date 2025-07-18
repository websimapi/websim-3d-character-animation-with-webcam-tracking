import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class CharacterAnimator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.character = null;
        this.skeleton = null;
        this.bones = {};
        
        this.pose = null;
        this.cameraUtils = null;
        this.trackingActive = false;
        
        this.init();
    }

    async init() {
        await this.setupThreeJS();
        await this.loadCharacter();
        this.setupUI();
        this.animate();
    }

    async setupThreeJS() {
        const container = document.getElementById('canvas-container');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 3, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('three-canvas'),
            antialias: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    async loadCharacter() {
        const loader = new GLTFLoader();
        
        // Create a simple rigged character if model not available
        this.createSimpleCharacter();
    }

    createSimpleCharacter() {
        // Create a simple humanoid character with bones
        const group = new THREE.Group();
        
        // Body parts
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00d4ff });
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.7;
        head.castShadow = true;
        
        // Spine
        const spineGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 8);
        const spine = new THREE.Mesh(spineGeometry, bodyMaterial);
        spine.position.y = 1.3;
        spine.castShadow = true;
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.4, 1.3, 0);
        leftArm.castShadow = true;
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.4, 1.3, 0);
        rightArm.castShadow = true;
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.2, 0.6, 0);
        leftLeg.castShadow = true;
        
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.2, 0.6, 0);
        rightLeg.castShadow = true;
        
        // Create skeleton
        const bones = [];
        
        // Root
        const rootBone = new THREE.Bone();
        rootBone.position.set(0, 0, 0);
        bones.push(rootBone);
        
        // Spine
        const spineBone = new THREE.Bone();
        spineBone.position.set(0, 1, 0);
        rootBone.add(spineBone);
        bones.push(spineBone);
        
        // Neck
        const neckBone = new THREE.Bone();
        neckBone.position.set(0, 0.3, 0);
        spineBone.add(neckBone);
        bones.push(neckBone);
        
        // Head
        const headBone = new THREE.Bone();
        headBone.position.set(0, 0.4, 0);
        neckBone.add(headBone);
        bones.push(headBone);
        
        // Left arm
        const leftShoulder = new THREE.Bone();
        leftShoulder.position.set(-0.4, 0.3, 0);
        spineBone.add(leftShoulder);
        bones.push(leftShoulder);
        
        const leftElbow = new THREE.Bone();
        leftElbow.position.set(0, -0.3, 0);
        leftShoulder.add(leftElbow);
        bones.push(leftElbow);
        
        // Right arm
        const rightShoulder = new THREE.Bone();
        rightShoulder.position.set(0.4, 0.3, 0);
        spineBone.add(rightShoulder);
        bones.push(rightShoulder);
        
        const rightElbow = new THREE.Bone();
        rightElbow.position.set(0, -0.3, 0);
        rightShoulder.add(rightElbow);
        bones.push(rightElbow);
        
        // Left leg
        const leftHip = new THREE.Bone();
        leftHip.position.set(-0.2, 0, 0);
        rootBone.add(leftHip);
        bones.push(leftHip);
        
        const leftKnee = new THREE.Bone();
        leftKnee.position.set(0, -0.4, 0);
        leftHip.add(leftKnee);
        bones.push(leftKnee);
        
        // Right leg
        const rightHip = new THREE.Bone();
        rightHip.position.set(0.2, 0, 0);
        rootBone.add(rightHip);
        bones.push(rightHip);
        
        const rightKnee = new THREE.Bone();
        rightKnee.position.set(0, -0.4, 0);
        rightHip.add(rightKnee);
        bones.push(rightKnee);
        
        // Create skinned mesh
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00d4ff });
        const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
        
        // Add parts to group
        group.add(head);
        group.add(spine);
        group.add(leftArm);
        group.add(rightArm);
        group.add(leftLeg);
        group.add(rightLeg);
        
        // Create skeleton helper
        this.skeleton = new THREE.Skeleton(bones);
        const skeletonHelper = new THREE.SkeletonHelper(group);
        group.add(skeletonHelper);
        
        this.character = group;
        this.bones = {
            head: headBone,
            neck: neckBone,
            spine: spineBone,
            leftShoulder: leftShoulder,
            leftElbow: leftElbow,
            rightShoulder: rightShoulder,
            rightElbow: rightElbow,
            leftHip: leftHip,
            leftKnee: leftKnee,
            rightHip: rightHip,
            rightKnee: rightKnee
        };
        
        this.scene.add(group);
    }

    setupUI() {
        const startBtn = document.getElementById('startTrackingBtn');
        const stopBtn = document.getElementById('stopTrackingBtn');
        const resetBtn = document.getElementById('resetPoseBtn');
        const showSkeleton = document.getElementById('showSkeleton');
        const showWebcam = document.getElementById('showWebcam');

        startBtn.addEventListener('click', () => this.startTracking());
        stopBtn.addEventListener('click', () => this.stopTracking());
        resetBtn.addEventListener('click', () => this.resetPose());
        
        showSkeleton.addEventListener('change', (e) => {
            if (this.skeleton) {
                this.skeleton.visible = e.target.checked;
            }
        });
        
        showWebcam.addEventListener('change', (e) => {
            const webcam = document.getElementById('webcam');
            const poseCanvas = document.getElementById('pose-canvas');
            webcam.style.display = e.target.checked ? 'block' : 'none';
            poseCanvas.style.display = e.target.checked ? 'block' : 'none';
        });

        // Hide loading
        document.getElementById('loading').classList.add('hidden');
    }

    async startTracking() {
        const status = document.getElementById('status');
        const webcamStatus = document.getElementById('webcamStatus');
        
        try {
            status.textContent = 'Starting tracking...';
            
            // Initialize pose detection
            this.pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
                }
            });
            
            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this.pose.onResults((results) => this.onPoseResults(results));
            
            // Setup webcam
            const video = document.getElementById('webcam');
            this.cameraUtils = new Camera(video, {
                onFrame: async () => {
                    await this.pose.send({ image: video });
                },
                width: 640,
                height: 480
            });
            
            await this.cameraUtils.start();
            
            this.trackingActive = true;
            status.textContent = 'Tracking active';
            webcamStatus.textContent = 'Connected';
            
            document.getElementById('startTrackingBtn').disabled = true;
            document.getElementById('stopTrackingBtn').disabled = false;
            
        } catch (error) {
            console.error('Error starting tracking:', error);
            status.textContent = 'Error: ' + error.message;
        }
    }

    stopTracking() {
        if (this.cameraUtils) {
            this.cameraUtils.stop();
        }
        
        this.trackingActive = false;
        document.getElementById('startTrackingBtn').disabled = false;
        document.getElementById('stopTrackingBtn').disabled = true;
        document.getElementById('status').textContent = 'Tracking stopped';
        document.getElementById('webcamStatus').textContent = 'Disconnected';
    }

    onPoseResults(results) {
        if (!results.poseLandmarks) return;
        
        const landmarks = results.poseLandmarks;
        
        // Draw pose on canvas
        const canvas = document.getElementById('pose-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw skeleton
        const drawingUtils = new DrawingUtils(ctx);
        drawingUtils.drawLandmarks(landmarks, {
            color: '#00d4ff',
            fillColor: '#00d4ff',
            radius: 3,
            lineWidth: 2
        });
        
        drawingUtils.drawConnectors(landmarks, POSE_CONNECTIONS, {
            color: '#ffffff',
            lineWidth: 2
        });
        
        // Map pose to character
        this.mapPoseToCharacter(landmarks);
    }

    mapPoseToCharacter(landmarks) {
        // Scale factor for mapping
        const scale = 2;
        
        // Map body parts
        if (landmarks[11] && landmarks[12]) {
            // Shoulders
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            
            // Calculate shoulder rotation
            const shoulderAngle = Math.atan2(
                rightShoulder.y - leftShoulder.y,
                rightShoulder.x - leftShoulder.x
            );
            
            this.bones.leftShoulder.rotation.z = -shoulderAngle * 0.5;
            this.bones.rightShoulder.rotation.z = -shoulderAngle * 0.5;
        }
        
        if (landmarks[13] && landmarks[14]) {
            // Elbows
            const leftElbow = landmarks[13];
            const rightElbow = landmarks[14];
            
            // Calculate arm angles
            const leftArmAngle = Math.atan2(
                leftElbow.y - landmarks[11].y,
                leftElbow.x - landmarks[11].x
            );
            const rightArmAngle = Math.atan2(
                rightElbow.y - landmarks[12].y,
                rightElbow.x - landmarks[12].x
            );
            
            this.bones.leftElbow.rotation.z = leftArmAngle;
            this.bones.rightElbow.rotation.z = rightArmAngle;
        }
        
        if (landmarks[23] && landmarks[24]) {
            // Hips
            const leftHip = landmarks[23];
            const rightHip = landmarks[24];
            
            // Calculate hip rotation
            const hipAngle = Math.atan2(
                rightHip.y - leftHip.y,
                rightHip.x - leftHip.x
            );
            
            this.bones.leftHip.rotation.z = -hipAngle * 0.3;
            this.bones.rightHip.rotation.z = -hipAngle * 0.3;
        }
        
        if (landmarks[25] && landmarks[26]) {
            // Knees
            const leftKnee = landmarks[25];
            const rightKnee = landmarks[26];
            
            const leftLegAngle = Math.atan2(
                leftKnee.y - landmarks[23].y,
                leftKnee.x - landmarks[23].x
            );
            const rightLegAngle = Math.atan2(
                rightKnee.y - landmarks[24].y,
                rightKnee.x - landmarks[24].x
            );
            
            this.bones.leftKnee.rotation.z = leftLegAngle;
            this.bones.rightKnee.rotation.z = rightLegAngle;
        }
        
        // Head rotation based on nose
        if (landmarks[0]) {
            const nose = landmarks[0];
            const centerX = (landmarks[11].x + landmarks[12].x) / 2;
            
            const headTurn = (nose.x - centerX) * 0.5;
            this.bones.head.rotation.y = headTurn;
        }
    }

    resetPose() {
        Object.values(this.bones).forEach(bone => {
            bone.rotation.set(0, 0, 0);
        });
    }

    onWindowResize() {
        const container = document.getElementById('canvas-container');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application
new CharacterAnimator();

