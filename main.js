// BABYLON.OBJFileLoader.SKIP_MATERIALS = false;
// BABYLON.OBJFileLoader.COMPUTE_NORMALS = false;
// BABYLON.OBJFileLoader.OPTIMIZE_NORMALS = false;
// BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = false;

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
var auto_rotate = 0;
var should_rotate = parseInt(auto_rotate);
var no_ui = 0;
baseModelFolder = "./model/";
baseHdriFolder = "./hdris/"


function create_default_material(scene){
    var pbrMaterial = new BABYLON.PBRMetallicRoughnessMaterial("pbr", scene);
    pbrMaterial.baseTexture = new BABYLON.Texture(baseModelFolder + "texture_kd.png", scene);
    pbrMaterial.metallicRoughnessTexture = new BABYLON.Texture(baseModelFolder + "texture_ks.png", scene);
    pbrMaterial.diffuseColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    pbrMaterial.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    pbrMaterial.roughness = 0.5;
    pbrMaterial.metallic = 1.;
    return pbrMaterial
}

var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    var pbrMaterial = create_default_material(scene);

    // BABYLON.MeshBuilder.CreateSphere("sphere",  {}, scene, function(sphere){ 
        // render(scene, pbrMaterial); 
    // });
    
    BABYLON.SceneLoader.ImportMesh("", "./model/", "model.obj", scene, function (meshes) { 
        render(scene, pbrMaterial);
    })
 
    // var current_mesh = scene.meshes[0].clone("clonedMesh");
    var filesInput = new BABYLON.FilesInput(engine, null, scene, null, null, null, function () {
        BABYLON.Tools.ClearLogCache()
    }, null, null);
    filesInput.onProcessFileCallback = (function(file, name, extension)
    {
        if (extension.toLowerCase() === "obj"){ 
            // scene.meshes.forEach(mesh => {
            //     mesh.dispose();
            // });

            const mesh = scene.meshes[0];
            mesh.dispose();

            BABYLON.SceneLoader.ImportMesh("", "", file, scene, function (meshes) {
                // var pbrMaterial = create_default_material(scene); 
                render(scene, pbrMaterial); 
            });
        }else if (extension === "png") {
            // scene.meshes.push(current_mesh);
            var reader = new FileReader();
            reader.onload = function(e) { 
                // var pbrMaterial = create_default_material(scene);
                pbrMaterial.baseTexture = new BABYLON.Texture(e.target.result, scene);
                
                render(scene, pbrMaterial);
            };
            reader.readAsDataURL(file);
    
        }else if (extension === "zip") { 
            var zip = new JSZip();
            zip.loadAsync(file).then(function (zipFile) {
                if (zipFile.file("model.obj")) {
                    // Extract the OBJ file and load it as a mesh
                    zipFile.file("model.obj").async("string").then(function(objBlob) {
                        // var objURL = URL.createObjectURL(objBlob);
                        // BABYLON.SceneLoader.AppendAsync("", objURL);
                        BABYLON.SceneLoader.ImportMesh("", "", "data:" + objBlob, scene, function (meshes) {

                        });
                    });
                } else {
                    console.log("ZIP file does not contain 'model.obj'.");
                }

            }); 
        } else {
            console.log("Unsupported file type: " + extension);
        }
        // remove mesh

        console.log("done: " + (typeof file) + " " + name + " " + extension);
        return true;
    }).bind(this);
    filesInput.reload = function(){
        const mesh = scene.meshes[0];
        mesh.dispose();
    };
    filesInput.monitorElementForDragNDrop(canvas);
 
 
};

function render(scene, pbrMaterial){
    var mesh = scene.meshes[0]; 
    mesh.material = pbrMaterial;
 
    // do something with the scene
    var camera = new BABYLON.ArcRotateCamera("camera1", Math.PI * 0.5, Math.PI / 2, 3.5, BABYLON.Vector3.Zero(), scene);
    camera.panningSensibility = 0;
    camera.lowerRadiusLimitSearch = 0.05;

    if (!should_rotate) {
        camera.attachControl(canvas, true);
    } else {
        camera.useAutoRotationBehavior = true;
        camera.autoRotationBehavior.idleRotationSpeed = -.5;
    }
 
    mesh.rotation.x = 1.5 * Math.PI;
    mesh.rotation.y = 0.25 * Math.PI;

    var skybox = BABYLON.Mesh.CreateBox("skyBox", 100.0, scene);
    var skyboxMaterial = new BABYLON.PBRMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.microSurface = 0.85;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;

    if (!no_ui) {
        var uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            "myUI"
        );
        var uiSize = uiTexture.getSize();
        var aspectRatio = uiSize.width / uiSize.height;
        var grid = new BABYLON.GUI.Grid();
        grid.addColumnDefinition(1.0 / 4.0); // 0
        grid.addColumnDefinition(1.0 / 4.0); // 1
        grid.addColumnDefinition(1.0 / 4.0); // 3
        grid.addColumnDefinition(1.0 / 4.0); // 4
        grid.addRowDefinition(1.0 / 8.0);
        grid.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        grid.height = (1.0 / 8.0);
        grid.width = 1.0;
    }

    var hdri_func = function (path) {
        var hdrTexture = new BABYLON.CubeTexture.CreateFromPrefilteredData(path, scene);
        hdrTexture.gammaSpace = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(path, scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        pbrMaterial.environmentTexture = hdrTexture;
    }

    if (!no_ui) {
        var createButton = function (grid, hdri_name, pos) {
            var col = pos % grid.columnCount;
            var row = Math.floor(pos / grid.columnCount) * 2;

            var button = BABYLON.GUI.Button.CreateImageOnlyButton(
                hdri_name,
                baseHdriFolder + hdri_name + ".jpg"
            );
            button.onPointerClickObservable.add(function () {
                hdri_func(baseHdriFolder + hdri_name + ".env");
            });
            grid.addControl(button, row, col);
        }

        uiTexture.addControl(grid);

        createButton(grid, "forest_slope", 0);
        createButton(grid, "lebombo", 1);
        createButton(grid, "photo_studio", 2);
        createButton(grid, "urban_alley", 3);

        // Create a stack panel for UI controls
        var _panel = new BABYLON.GUI.StackPanel();
        _panel.width = "220px";
        _panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        _panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        uiTexture.addControl(_panel);

        // Roughness slider
        var roughnessSlider = new BABYLON.GUI.Slider();
        roughnessSlider.minimum = 0.0;
        roughnessSlider.maximum = 1.0;
        roughnessSlider.value = pbrMaterial.roughness;
        roughnessSlider.width = "200px";
        roughnessSlider.height = "20px";
        roughnessSlider.onValueChangedObservable.add(function (value) {
            pbrMaterial.roughness = value;
            mesh.material = pbrMaterial;
        });
        _panel.addControl(roughnessSlider);

        // Roughness label
        var roughnessLabel = new BABYLON.GUI.TextBlock();
        roughnessLabel.text = "Roughness";
        roughnessLabel.height = "20px";
        roughnessLabel.color = "white";
        _panel.addControl(roughnessLabel);

    }

    hdri_func(baseHdriFolder + "forest_slope.env");

    if (!should_rotate) {
        var rotatingCamera = true;
        if (!no_ui) {
            var panel = new BABYLON.GUI.StackPanel();
            panel.width = "200px";
            panel.height = "80px";
            panel.isVertical = false;
            panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            uiTexture.addControl(panel);

            var checkbox = new BABYLON.GUI.Checkbox();
            checkbox.width = "20px";
            checkbox.height = "20px";
            checkbox.isChecked = rotatingCamera;
            checkbox.color = "gray";
            var clicked = false;

            var currentPosition = { x: 0, y: 0 };
            var currentRotation = { x: 0, y: 0 };

            var getCurPos = function (evt) {
                currentPosition.x = evt.clientX;
                currentPosition.y = evt.clientY;
                currentRotation.x = mesh.rotation.x;
                currentRotation.y = mesh.rotation.y;
                clicked = true;
            }
            var rotate = function (evt) {
                if (!clicked) {
                    return;
                }
                mesh.rotation.y = currentRotation.y - (evt.clientX - currentPosition.x) / 100.0;
                mesh.rotation.x = currentRotation.x + (evt.clientY - currentPosition.y) / 100.0;
            }
            var stop = function (evt) {
                clicked = false;
            }

            checkbox.onIsCheckedChangedObservable.add(function (value) {
                rotatingCamera = !rotatingCamera;
                if (rotatingCamera) {
                    canvas.removeEventListener("pointerdown", getCurPos);
                    canvas.removeEventListener("pointermove", rotate);
                    canvas.removeEventListener("pointerup", stop);
                    camera.attachControl(canvas, true);
                } else {
                    camera.detachControl();
                    canvas.addEventListener("pointerdown", getCurPos);
                    canvas.addEventListener("pointermove", rotate);
                    canvas.addEventListener("pointerup", stop);
                }
            });
            panel.addControl(checkbox);
            var header = new BABYLON.GUI.TextBlock();
            header.text = "Rotate Camera";
            header.width = "180px";
            header.marginLeft = "10px";
            header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            header.color = "white";
            panel.addControl(header);
        }
    }

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();
    });


    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });



}
var scene = createScene();
// window.addEventListener('DOMContentLoaded', function() {
//     var scene = createScene();
// })
