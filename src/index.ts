/* CSCI 4262 Mile stone 2
 * Author:  Jett Wolfe, Rui Zeng
 */ 

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { WebXRControllerComponent, WebXRManagedOutputCanvasOptions } from "@babylonjs/core/XR";
import { WebXRInputSource } from "@babylonjs/core/XR/webXRInputSource";

// Side effects
import "@babylonjs/loaders/glTF/2.0/glTFLoader"
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/inspector"
import "@babylonjs/core/Physics/physicsEngineComponent"
import { AbstractMesh, AssetsManager, CannonJSPlugin, CubeTexture, DirectionalLight, HemisphericLight, HighlightLayer, Logger, Material, Mesh, MeshBuilder, PhysicsImpostor, SceneLoader, StandardMaterial, Texture } from "@babylonjs/core";

class Game 
{ 
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;

    private visibility : number;

    private leftCon : WebXRInputSource | null;

    constructor()
    {
        // Get the canvas element 
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

        // Generate the BABYLON 3D engine
        this.engine = new Engine(this.canvas, true); 

        // Creates a basic Babylon Scene object
        this.scene = new Scene(this.engine);   

        this.visibility = 0;

        this.leftCon = null;
    }

    
    start() : void
    {
        this.createScene().then(() => {
            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(() => { 
                this.controllerInput();
                this.scene.render();
            });

            // Watch for browser/canvas resize events
            window.addEventListener("resize", () => { 
                this.engine.resize();
            });
        });
    }

    private async createScene()
    {
        // This creates and positions a first-person camera (non-mesh)
        var camera = new UniversalCamera("camera1", new Vector3(0, 0, 0), this.scene);
        camera.fov = 90 * Math.PI / 180;
        camera.target = new Vector3(0.66, 0, 0.75)

        // This attaches the camera to the canvas
        camera.attachControl(this.canvas, true);

        // There is a bug in Babylon 4.1 that fails to enable the highlight layer on the Oculus Quest. 
        // This workaround fixes the problem.
        var canvasOptions = WebXRManagedOutputCanvasOptions.GetDefaults();
        canvasOptions.canvasOptions!.stencil = true;

        // Creates the XR experience helper
        const xrHelper = await this.scene.createDefaultXRExperienceAsync({outputCanvasOptions: canvasOptions});

        // There is a bug in Babylon 4.1 that fails to reenable pointer selection after a teleport
        // This is a hacky workaround that disables a different unused feature instead
        xrHelper.teleportation.setSelectionFeature(xrHelper.baseExperience.featuresManager.getEnabledFeature("xr-background-remover"));

        // Register event handler for selection events (pulling the trigger, clicking the mouse button)
        this.scene.onPointerObservable.add((pointerInfo) => {
            this.processPointer(pointerInfo);
        });

        // Register event handler when controllers are added
        xrHelper.input.onControllerAddedObservable.add((controller) => {
            if(controller.uniqueId.endsWith("left")){
                this.leftCon = controller;
            }
            this.onControllerAdded(controller);
        });

        // Register event handler when controllers are removed
        xrHelper.input.onControllerRemovedObservable.add((controller) => {
            this.onControllerRemoved(controller);
        });

    // Add code to create your scene here
       
        //create a ground
        const environment = this.scene.createDefaultEnvironment({
            createGround: true,
            groundSize: 200,
            skyboxSize: 0
        });

        var assets = new AssetsManager(this.scene);
    
        //create lights
        var light = new HemisphericLight("light", new Vector3(0,1,0),this.scene);
        light.intensity = 0.5;

        var sun = new DirectionalLight("theSun", new Vector3(0,-1,0),this.scene);

        //skybox
        var skybox = MeshBuilder.CreateBox("sky", {size: 1000}, this.scene);
        var skyMaterial = new StandardMaterial("sky", this.scene);
        skyMaterial.backFaceCulling = false;
        skyMaterial.disableLighting = true;
        var skyTexture = new CubeTexture("assets/skybox/skybox", this.scene);
        skyTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyMaterial.reflectionTexture = skyTexture;
        skybox.material =  skyMaterial;
        skybox.infiniteDistance = true;
 

        //Loading in the city
        var cityTask = assets.addMeshTask("cityTask", "", "assets/city_grid/", "scene.gltf");

        cityTask.onSuccess = (task) => {
            var city = cityTask.loadedMeshes[0];
            city.position = new Vector3(-3000, -60, -3000);
            city.scaling = new Vector3(100, 100, 100);

            //Adding floor mesh for teleportation
            cityTask.loadedMeshes.forEach(mesh => {
                xrHelper.teleportation.addFloorMesh(mesh);
            });
        }

        assets.load();  
    }

    // Event handler for processing pointer selection events
    private processPointer(pointerInfo: PointerInfo)
    {
        switch (pointerInfo.type) {
            case PointerEventTypes.POINTERDOWN:
                if (pointerInfo.pickInfo?.hit) {
                    console.log("selected mesh: " + pointerInfo.pickInfo.pickedMesh?.name + " at " + pointerInfo.pickInfo.pickedPoint);
              
                }
                break;
        }
    }

    // Event handler when controllers are added
    private onControllerAdded(controller : WebXRInputSource) {
        console.log("controller added: " + controller.uniqueId);

        //Attaching the tablet to the left hand of the player 
        if(controller.uniqueId.endsWith("left")){
            this.leftCon = controller;
            
            //Loading in the map texture 
            var mapMaterial = new StandardMaterial("map", this.scene);
            var mapText = new Texture("assets/mini_map.jpg", this.scene);
            mapMaterial.diffuseTexture = mapText;

            //Loading in the tablet 
            SceneLoader.ImportMesh("", "assets/tablet/", "scene.gltf", this.scene, (meshes)=>{
                meshes[0].scaling = new Vector3(0.2, 0.2, 0.2);
                meshes[0].setParent(controller.grip!);
                meshes[0].position = Vector3.ZeroReadOnly;
                meshes[0].locallyTranslate(new Vector3(-2, 0, 0));
                meshes[0].rotation = new Vector3(-0.5, 3.1415, 0);
                meshes[0].name = "tablet";

                //Disable the mesh
                //meshes[0].setEnabled(false);

                //Applying the map as a texture over the screen
                meshes.forEach(mesh => {
                    if(mesh.name.endsWith("10")){
                        mesh.material = mapMaterial;
                    }
                }); 
            });
        }
    }

    // Event handler when controllers are removed
    private onControllerRemoved(controller : WebXRInputSource) {
        console.log("controller removed: " + controller.pointer.name);
    }

    private controllerInput() : void {
        //Left squeeze
        this.onLeftSqueeze(this.leftCon?.motionController?.getComponent("xr-standard-squeeze"));
    }

    //Event handler when left button is squeezed 
    private onLeftSqueeze(component? : WebXRControllerComponent)
    {
        if(component?.changes.pressed){
            if(component.pressed){
                console.log("Left squeeze active");
            }
            else{
                console.log("Left squeeze released");
            }
        }
    }
}
/******* End of the Game class ******/   

// Start the game
var game = new Game();
game.start();
