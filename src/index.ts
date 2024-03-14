/* CSCI 4262 Assignment 3,
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

    private highlightObject: AbstractMesh | null;
    private highlight : HighlightLayer;

    private rightHand : WebXRInputSource | null;

    private bat : AbstractMesh | null;

    constructor()
    {
        // Get the canvas element 
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

        // Generate the BABYLON 3D engine
        this.engine = new Engine(this.canvas, true, {stencil:true}); 

        // Creates a basic Babylon Scene object
        this.scene = new Scene(this.engine);   

        //Highlight layer & object
        this.highlightObject = null;
        this.highlight = new HighlightLayer("highlight", this.scene);

        this.rightHand = null;

        this.bat = null;
    }

    start() : void
    {
        this.createScene().then(() => {
            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(() => { 
                this.scene.render();

                //Constantly update highlights
                this.update();
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
        var camera = new UniversalCamera("camera1", new Vector3(0, 2.5, 20), this.scene);
        camera.fov = 90 * Math.PI / 180;
        camera.target = new Vector3(0.05, 1.61, -2);

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

        //Light
        var light = new HemisphericLight("light", new Vector3(0,1,0), this.scene);
        light.diffuse = new Color3(1, 0.7, 0.7);

        //Asset manager
        var assets = new AssetsManager(this.scene);

        //Skybox
        var skybox = MeshBuilder.CreateBox("sky", {size: 100}, this.scene);
        skybox.scaling = new Vector3(100, 100, 100);
        var skyMaterial = new StandardMaterial("sky", this.scene);
        skyMaterial.backFaceCulling = false;
        skyMaterial.disableLighting = true;
        var skyTexture = new CubeTexture("textures/skybox/sky", this.scene);
        skyTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyMaterial.reflectionTexture = skyTexture;
        skybox.material =  skyMaterial;
        skybox.infiniteDistance = true;

        //Ground mesh
        var groundTask = assets.addMeshTask("groundTask", "", "textures/desert_biome/", "scene.gltf");

        groundTask.onSuccess = (task) => {
            var groundMesh = groundTask.loadedMeshes[0];
            groundMesh.scaling = new Vector3(1000, 1000, 1000);
            groundMesh.position = new Vector3(0, -158, 0);
            groundMesh.name = "DesertBiome";

            //Adding floor mesh for teleportation
            groundTask.loadedMeshes.forEach(mesh => {
                xrHelper.teleportation.addFloorMesh(mesh);
            });
        }

        //House mesh 
        var houseTask = assets.addMeshTask("houseTask", "", "textures/abandoned_house/", "scene.gltf");

        houseTask.onSuccess = (task) => {
            var houseMesh = houseTask.loadedMeshes[0];
            houseMesh.position = new Vector3(0, -1, -5);
            houseMesh.rotation = new Vector3(0, 4.7, 0);
            houseMesh.scaling = new Vector3(2.5, 3, 3);
            houseMesh.name = "house";
        }

        //Rock (and roll?)
        var rockTask = assets.addMeshTask("rockTask", "", "textures/sandstone_mesa/", "scene.gltf");
        
        rockTask.onSuccess = (task)=> {
            var rockMesh = rockTask.loadedMeshes[0];
            rockMesh.scaling = new Vector3(100, 100, 100);
            rockMesh.rotation = new Vector3(6.1, 1.2, 0);
            rockMesh.position = new Vector3(-50, -25, 5);
            rockMesh.name = "rock";
        }

        //Skull (ooo spooky!)
        var skullTask = assets.addMeshTask("skullTask", "", "textures/lion_skull/", "scene.gltf");

        skullTask.onSuccess = (task)=>{
            var skullMesh = skullTask.loadedMeshes[0];
            skullMesh.scaling = new Vector3(0.01, 0.01, 0.01);
            skullMesh.position = new Vector3(0, 0.3, 5);
            skullMesh.rotation = new Vector3(0, 1.047, 0);
            skullMesh.name = "skull";
        }

        //A warning sign 
        var signTask = assets.addMeshTask("signTask", "", "textures/old_sign/", "scene.gltf");
        
        signTask.onSuccess = (meshes)=>{
            var signMesh = signTask.loadedMeshes[0];
            signMesh.scaling = new Vector3(0.5, 0.5, -0.5);
            signMesh.position = new Vector3(-10, 0, 5);
            signMesh.rotation = new Vector3(0, 3.49, 0);
            signMesh.name = "sign";
        }

        //An old fence 
        var fenceTaskA = assets.addMeshTask("fenceTaskA", "", "textures/old_fence/", "scene.gltf");
        
        fenceTaskA.onSuccess = (meshes)=>{
            var fenceMeshA = fenceTaskA.loadedMeshes[0];
            fenceMeshA.scaling = new Vector3(0.05, 0.05, 0.05);
            fenceMeshA.position = new Vector3(30, -3, 0);
            fenceMeshA.rotation = new Vector3(0, 1.57, 0);
            fenceMeshA.name = "fenceA";
        }

        //More fence 
        var fenceTaskB = assets.addMeshTask("fenceTaskB", "", "textures/old_fence/", "scene.gltf");
        
        fenceTaskB.onSuccess = (meshes)=>{
            var fenceMeshB = fenceTaskB.loadedMeshes[0];
            fenceMeshB.scaling = new Vector3(0.05, 0.05, 0.05);
            fenceMeshB.position = new Vector3(30, -3, 23);
            fenceMeshB.rotation = new Vector3(0, 1.57, 0);
            fenceTaskB.loadedMeshes[0].name = "fenceB";
        }

        //A bush 
        var bushTask = assets.addMeshTask("bushTask", "", "textures/bush/", "scene.gltf");

        bushTask.onSuccess = (meshes)=>{
            var bushMesh = bushTask.loadedMeshes[0];
            bushMesh.position = new Vector3(10, -1, -5);
            bushMesh.scaling = new Vector3(4, 4, 4);
            bushMesh.name = "bush";
        }

        //A cactus
        var cacTask = assets.addMeshTask("cacTask", "", "textures/cactus/", "scene.gltf");
        
        cacTask.onSuccess = (meshes)=>{
            var cactusMesh = cacTask.loadedMeshes[0];
            cactusMesh.position = new Vector3(15, -2, 0);
            cactusMesh.scaling = new Vector3(5, 5, -5);
            cactusMesh.name = "cactus";
        }

        assets.load();  

        SceneLoader.ImportMesh("", "textures/iron_hand/", "scene.gltf", this.scene, null);
    }

    // Event handler for processing pointer selection events
    private processPointer(pointerInfo: PointerInfo)
    {
        switch (pointerInfo.type) {
            case PointerEventTypes.POINTERDOWN:
                if (pointerInfo.pickInfo?.hit) {
                    
                    console.log("selected mesh: " + pointerInfo.pickInfo.pickedMesh?.name);
                    
                    //If the mesh is not already the highlighted item, make it the highlighted item
                    if(this.highlightObject != pointerInfo.pickInfo.pickedMesh) this.highlightObject = pointerInfo.pickInfo.pickedMesh; 

                    //Otherwise, there should be no highlighted item
                    else this.highlightObject = null;
                }
                break;
        }
    }

    //Updating the highlights
    private update()
    {
        //If an item is selected
        if(this.highlightObject != null)
        {
            //remove existing highlights and add the highlighted object
            this.highlight.removeAllMeshes();
            this.highlight.addMesh(this.highlightObject as Mesh, new Color3(0.44, 1, 0));
        } 

        //If no item is selected, ensure no items are highlighted
        else{
            this.highlight.removeAllMeshes();
        }
    }

    // Event handler when controllers are added
    private onControllerAdded(controller : WebXRInputSource) {
        console.log("controller added: " + controller.pointer.name);

        if(controller.uniqueId.endsWith("right")) {
            SceneLoader.ImportMesh("", "textures/bat/", "scene.gltf", this.scene, (meshes) => {
                meshes[0].name = "bat";
                meshes[0].scaling= new Vector3(0.3, 0.3, 0.3);
                meshes[0].setParent(controller.grip!);
                meshes[0].position = Vector3.ZeroReadOnly;
                meshes[0].locallyTranslate(new Vector3(-0.5, 0.5, 0));
            });  
        }
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
