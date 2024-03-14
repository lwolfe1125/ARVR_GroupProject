# Assignment 3: Getting Started with WebXR

**Due: Friday, March 8th, 11:59pm Atlantic Time**

The purpose of this assignment is for you to get you started developing virtual reality experiences using WebXR in Babylon.js.  A template project has been provided with an empty scene.  You are free to use any legal sources for third party assets in your virtual environment, and you can create any type of scene that you want.  Creativity is encouraged!

The experience must run on the Oculus Quest, so you should be careful to only use low poly models.  Sometimes 3D assets found online are mistakenly labeled as low poly, so make sure to check the file sizes after you download them.  For reference, the entire scene used in the tutorial was about 6MB.  Note that outdoor scenes may need a skybox to display correctly on the Quest. While this was not necessary in the tutorial, I have since updated the codebase to include a skybox (for purposes of illustration).

## Submission Information

You should fill out this information before submitting your assignment.  Make sure to document the name and source of any third party assets such as 3D models, textures, or any other content used that was not solely written by you.  Include sufficient detail for the instructor or TA to easily find them, such as asset store or download links.

Name: Jett Wolfe

Dal Email: lr296711@dal.ca

Build URL: https://web.cs.dal.ca/~lwolfe/AR_VR_A3 

Third Party Assets:

Sunset Photo by Rahul Pandit on Unsplash
https://unsplash.com/photos/lightning-strike-on-the-sky-during-night-time-xRS62kXbcLc?utm_content=creditShareLink&utm_medium=referral&utm_source=unsplash

"Hot Desert Biome - Terrain" (https://skfb.ly/oEZoo) by artfromheath is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
https://skfb.ly/oEZoo

"Abandoned House" (https://skfb.ly/owGxR) by Sengchor is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
https://skfb.ly/owGxR 

"Sandstone mesa megascan" (https://skfb.ly/oEGWz) by GoochFauxRock is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
https://skfb.ly/oEGWz 

"Lion Skull" (https://skfb.ly/KrEy) by Auckland Museum is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
https://skfb.ly/KrEy

"Cactus 2 (saguaro)" (https://skfb.ly/o9CST) by evolveduk is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
https://skfb.ly/o9CST

"Dry bush" (https://skfb.ly/oGqUx) by Luis Gustavo is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
https://skfb.ly/oGqUx

"Old fence" (https://skfb.ly/6Rq7P) by Yury Misiyuk is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
https://skfb.ly/6Rq7P

"Basic Bat" (https://skfb.ly/orrzy) by Blender3D is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
https://skfb.ly/orrzy

## Rubric

Graded out of 10 points.  Each of the parts to be added are presented in the tutorial or covered in the [Babylon](https://doc.babylonjs.com/features/introductionToFeatures) tutorials.

1. The virtual environment contains at least one floor mesh for teleportation. (1)
2. The virtual environment contains at least five mesh objects other than the ground. You are allowed to load multiple mesh objects from a single file, and you can also use `MeshBuilder`. (1)
3. Add a [highlight layer](https://doc.babylonjs.com/features/featuresDeepDive/mesh/highlightLayer) to your scene.  Any mesh that is selected by the controller trigger button should be highlighted using a color of your choice.  Note that you may need to type cast an `AbstractMesh` to a `Mesh`. (2)
4. When the same object is selected again, it should be deselected and the highlight should be removed. (1)
5. When a different object is selected, any currently selected object should be deselected so that only one object can be highlighted at once. (1)
6. Attach a mesh object to your controller so that it follows your hand as you move it around. The event handlers for `onControllerAdded` and `onControllerRemoved` have already been added to your scene.  You can find the transform node for a  controller using `controller.pointer`. (2)
7. The immersive scene loads correctly using the WebXR emulator and the ground appears at the correct height. (1)
8. The project also works on the Oculus Quest. (1)

**Bonus Challenge:** Replace the controller meshes with custom models of your choosing. Popular choices include lightsabers, swords, magic wands, or similar objects. Hint: you will need to use an `onMeshLoadedObservable`, which is described in  [WebXR Controllers Support](https://doc.babylonjs.com/features/featuresDeepDive/webXR/webXRInputControllerSupport). (1)

Make sure to document all third party assets. ***Be aware that points will be deducted for using third party assets that are not properly documented.***

Note: if your scene contains `InstancedMesh` objects, then highlighting will only work when selecting the original mesh (and it will select all the instanced meshes at the same time).  This may happen if you export a Unity scene that contains multiple copies of one mesh.  The workaround involves cloning the original mesh and ends up being quite complicated.  So, you will not lose any points if this occurs in your scene.

## Submission

You will need to clone this project and give the instructor access to your repo on the FCS GitLab.  The project folder should contain just the additions to the sample project that are needed to implement the project.  Do not add extra files, and do not remove the `.gitignore` file (we do not want the "node_modules" directory in your repository.)

**Do not change the names** of the existing files.  The instructor needs to be able to test your program as follows:

1. cd into the directory and run ```npm install```
2. start a local web server and compile by running ```npm run start``` and pointing the browser at your ```index.html```

Please test that your submission meets these requirements.  For example, after you check in your final version of the assignment to GitLab, check it out again to a new directory and make sure everything builds and runs correctly.

## Local Development 

After checking out the project, you need to initialize by pulling the dependencies with:

```
npm install
```

After that, you can compile and run a server with:

```
npm run start
```

Under the hood, we are using the `npx` command to both build the project (with webpack) and run a local http webserver on your machine.  The included ```package.json``` file is set up to do this automatically.  You do not have to run ```tsc``` to compile the .js files from the .ts files;  ```npx``` builds them on the fly as part of running webpack.

You can run the program by pointing your web browser at ```https://your-local-ip-address:8080```.  

## Build and Deployment

After you have finished the assignment, you can build a distribution version of your program with:

```
npm run build
```

Make sure to include your assets in the `dist` directory.  The debug layer should be disabled in your final build.  Remember to move any assets to your public webserver and ensure that the corresponding directories and files have the correct permissions. You should include this URL in submission information section of your `README.md` file. 

## License

Material for this assignment was created by E.S. Rosenberg and is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).

The intent of choosing CC BY-NC-SA 4.0 is to allow individuals and instructors at non-profit entities to use this content.  This includes not-for-profit schools (K-12 and post-secondary). For-profit entities (or people creating courses for those sites) may not use this content without permission (this includes, but is not limited to, for-profit schools and universities and commercial education sites such as Coursera, Udacity, LinkedIn Learning, and other similar sites).   

## Acknowledgments

This assignment was adapted for CSCI 4262 by Derek Reilly, and was originally based upon content from the 3D User Interfaces Fall 2020 course by Blair MacIntyre.
