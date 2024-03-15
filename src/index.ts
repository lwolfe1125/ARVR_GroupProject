/* Code setup from
 * CSCI 4262 Assignment 3,
 * Author: Evan Suma Rosenberg
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
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
import { AbstractMesh, AssetsManager, CubeTexture, DebugLayer, HemisphericLight, HighlightLayer, Mesh, MeshBuilder, SceneLoader, StandardMaterial, Texture } from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";


// Note: The structure has changed since previous assignments because we need to handle the 
// async methods used for setting up XR. In particular, "createDefaultXRExperienceAsync" 
// needs to load models and create various things.  So, the function returns a promise, 
// which allows you to do other things while it runs.  Because we don't want to continue
// executing until it finishes, we use "await" to wait for the promise to finish. However,
// await can only run inside async functions. https://javascript.info/async-await
class Game 
{ 
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;

    constructor()
    {
        // Get the canvas element 
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

        // Generate the BABYLON 3D engine
        this.engine = new Engine(this.canvas, true, {stencil:true}); 

        // Creates a basic Babylon Scene object
        this.scene = new Scene(this.engine);   
    }

    start() : void
    {
        this.createScene().then(() => {
            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(() => { 
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
            this.onControllerAdded(controller);
        });

        // Register event handler when controllers are removed
        xrHelper.input.onControllerRemovedObservable.add((controller) => {
            this.onControllerRemoved(controller);
        });

        // The scene 

        var light = new HemisphericLight("light", new Vector3(0, 0, 0), this.scene);

        //Asset manager
        var assets = new AssetsManager(this.scene);

        //Skybox
        var skybox = MeshBuilder.CreateBox("sky", {size: 100}, this.scene);
        skybox.scaling = new Vector3(100, 100, 100);
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
        }

        assets.load();  
    }

    // Event handler for processing pointer selection events
    private processPointer(pointerInfo: PointerInfo)
    {
        
    }

    // Event handler when controllers are added
    private onControllerAdded(controller : WebXRInputSource) {
        console.log("controller added: " + controller.pointer.name);
    }

    // Event handler when controllers are removed
    private onControllerRemoved(controller : WebXRInputSource) {
        console.log("controller removed: " + controller.pointer.name);
    }

}
/******* End of the Game class ******/   

// Start the game
var game = new Game();
game.start();
