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
import * as Cannon from "cannon"
import { AbstractMesh, AssetsManager, CannonJSPlugin, CubeTexture, DirectionalLight, HemisphericLight, HighlightLayer, Logger, Mesh, MeshBuilder, PhysicsImpostor, StandardMaterial, Texture } from "@babylonjs/core";


class Game 
{ 
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;


    private rightGrabbedObject: AbstractMesh | null;
    private grabbableObjects: Array<AbstractMesh>;
    private hl_red: HighlightLayer;
    private hl_green: HighlightLayer;
    private currentMesh: AbstractMesh | null; 
    constructor()
    {
        // Get the canvas element 
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

        // Generate the BABYLON 3D engine
        this.engine = new Engine(this.canvas, true); 

        // Creates a basic Babylon Scene object
        this.scene = new Scene(this.engine);   

        //initial controller with grab function
  
        this.rightGrabbedObject = null;
        this.grabbableObjects = [];
        this.hl_red = new HighlightLayer("hlr",this.scene);
        this.hl_green = new HighlightLayer("hlg",this.scene);
        this.currentMesh = null;
    }

    
    start() : void
    {
        this.createScene().then(() => {
            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(() => { 
                //this.update();
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
        var camera = new UniversalCamera("camera1", new Vector3(0, 1.6, 0), this.scene);
        camera.fov = 90 * Math.PI / 180;

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

    // Add code to create your scene here
       
        //create a ground
        const environment = this.scene.createDefaultEnvironment({
            createGround: true,
            groundSize: 200,
            skyboxSize: 0
            //skyboxColor: new Color3(0.059, 0.663, 0.8)
        });
        
        //physics
        this.scene.enablePhysics(new Vector3(0,-8,0), new CannonJSPlugin(undefined,undefined, Cannon));
        
        //ground teleportation
        xrHelper.teleportation.addFloorMesh(environment!.ground!);
        environment!.ground!.isVisible = false;
        environment!.ground!.position = new Vector3(0,0.2,0);
        environment!.ground!.physicsImpostor = new PhysicsImpostor(environment!.ground!, PhysicsImpostor.BoxImpostor,
            {mass:0, friction: 0.5, restitution: 0.7, ignoreParent: true},this.scene);


        //create lights
        var light = new HemisphericLight("light", new Vector3(0,1,0),this.scene);
        light.intensity = 0.5;

        var sun = new DirectionalLight("theSun", new Vector3(0,-1,0),this.scene);

        //skybox
        
        var skybox = MeshBuilder.CreateBox("sky", {size: 1000}, this.scene);
        //skybox.scaling = new Vector3(100, 100, 100);
        var skyMaterial = new StandardMaterial("sky", this.scene);
        skyMaterial.backFaceCulling = false;
        skyMaterial.disableLighting = true;
        var skyTexture = new CubeTexture("assets/skybox/skybox", this.scene);
        skyTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyMaterial.reflectionTexture = skyTexture;
        skybox.material =  skyMaterial;
        skybox.infiniteDistance = true;
 

        //load assets
        var assetsManger = new AssetsManager(this.scene);

        //add taks about mech been load in asserts
        var worldTask = assetsManger.addMeshTask("world task","","assets/city_grid/","scene.gltf");
        worldTask.onSuccess = (task) => {
            worldTask.loadedMeshes[0].name = "world";
            worldTask.loadedMeshes[0].position = new Vector3(-400,-4.05,300);
            worldTask.loadedMeshes[0].scaling = new Vector3(10,10,-10);
       
            
        }

      
        //do tasks
        assetsManger.load();

        //things after loading done
        assetsManger.onFinish = (tasks) => {
            //show debug layer
            this.scene.debugLayer.show();
        };
        
        
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
