const N = 256;

// ссылка на блок веб-страницы, в котором будет отображаться графика
var container;

// переменные: камера, сцена и отрисовщик
var camera, scene, renderer;
var cursor;
var mouse = {x: 0, y: 0};
var circle;
var rad = 10;

var clock = new THREE.Clock();

// глобальная переменная для хранения карты высот
var imagedata;

var geometry;
var isPressed = false;
mousedown = 0;

//Ссылка на выбранный объект
var picked = null;

//Массив моделей отображаемых в сцене
//Массив объектов с которыми будет обнаруживаться пересечение
var targets = [];

//Список объектов с которыми возможно пересечение курсора мыши
var targetList = [];

//Массив предзагружаемых моделей
var preload = [];

var checkbox = false;

// функция инициализации камеры, отрисовщика, объектов сцены и т.д.
init();

// обновление данных по таймеру браузера
animate();

// в этой функции можно добавлять объекты и выполнять их первичную настройку
function init() 
{
    container = document.getElementById( 'container' );
    scene = new THREE.Scene();

    // Установка параметров каметры
    // 45 - угол обзора
    // window.innerWidth / window.innerHeight - соотношение сторон
    // 1 - 4000 - ближняя и дальняя плоскости отсечения
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 40000 );	

    // Усиановка позиции камеры
    camera.position.set(N/2, N/2, N+N/2);
    
    // Установка точки, на которую камера будет направлена
    camera.lookAt(new THREE.Vector3(N/2, 0, N/2));                            
    
    //Создание отрисовщика
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth-30, window.innerHeight-30 );
    
    //Установка фонового цвета
    renderer.setClearColor( 0x888888, 1 );
    container.appendChild( renderer.domElement );

    //Добавление функции обработки события изменения размеров окна
    window.addEventListener( 'resize', onWindowResize, false );

    renderer.domElement.addEventListener("contextmenu", function (event) {
        event.preventDefault();
    });

    //Добавление функции обработки события мыши:
    //нажатие кнопки, отжатие кнопки, перемещение курсора, поворот колёсика
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'wheel', onDocumentMouseScroll, false );
    
    // Добавление источника освещения
    var spotlight = new THREE.PointLight(0xffff00);
    spotlight.position.set(N * 2, N * 2, N / 2);
    scene.add(spotlight);

    addSphere(3000, "pics/sky.jpg");

   //Добавление интерфейса
    createGUI();

    cursor = addCursor();
    circle = addCircle(32);

    //Создание плоскости
    terrain();

    loadModel('models/Trees/Tree/', 'Tree.obj', 'Tree.mtl', 0.2);
    loadModel('models/Bush/', 'Bush1.obj', 'Bush1.mtl', 10.0);
    loadModel('models/House/', 'Cyprys_House.obj', 'Cyprys_House.mtl', 4.0);
}

function onWindowResize() 
{
    // изменение соотношения сторон для виртуальной камеры
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // изменение соотношения сторон рендера
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() 
{
    var delta = clock.getDelta();
    
    if (isPressed == true)
    {
        if (mousedown == 1)
        {
            hSphere(1, delta);
                
        }
        if (mousedown == -1)
        {
            hSphere(-1, delta);
        }
    }
    
    requestAnimationFrame( animate );
    render();
}

function render() 
{
    renderer.render( scene, camera );
}

function onWindowResize() 
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function terrain()
{   
    var vertices = [];
    var faces = [];
    var uvs = [];

    geometry = new THREE.BufferGeometry();

    for (var i = 0; i < N; i++)
    {
        for (var j = 0; j < N; j++)
        {
            vertices.push(i, 0.0, j);
            uvs.push(i / (N - 1), j / (N - 1));
        }
    }

    for (var i = 0; i < N - 1; i++)
    {
        for (var j = 0; j < N - 1; j++)
        {
            var v1 = i + j * N;
            var v2 = (i + 1) + j * N;
            var v3 = (i + 1) + (j + 1) * N;
            var v4 = i + (j + 1) * N;

            faces.push(v1, v2, v3);
            faces.push(v1, v3, v4);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(faces);

    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    geometry.computeVertexNormals();

    var tex = new THREE.TextureLoader().load('pics/grasstile.jpg');
    // режим повторения текстуры
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; 
    // повторить текстуру 10 на 10 раз
    tex.repeat.set(1, 1);

    var mat = new THREE.MeshLambertMaterial({
        map: tex,
        wireframe: false,
        side: THREE.DoubleSide
    });

    var mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(0.0, 0.0, 0.0);
    scene.add(mesh);

    targetList.push(mesh);
}

function addSphere(radius, texName){
    // создание геометрии для сферы	
    var geometry = new THREE.SphereGeometry(radius, 32, 32);

    // загрузка текстуры
    var tex = new THREE.TextureLoader().load(texName);
    tex.minFilter = THREE.NearestFilter;

    // создание материала
    var material = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide
    });

    // создание объекта
    var sphere = new THREE.Mesh(geometry, material);

    // размещение объекта в сцене
    scene.add(sphere);
}

function onDocumentMouseScroll( event )
{
    if (event.wheelDelta > 0)
    {
        if (checkbox == false)
        {
            rad++;
        }
        else
        {
            if (picked)
            {
                picked.update();
                picked.rotation.y += 0.1;
                picked.userData.model.rotation.y += 0.1; 
                //обновление матрицы поворота объекта/OBB модели
                picked.userData.obb.basis.extractRotation( picked.userData.model.matrixWorld );
            }
        }
    }
    if (event.wheelDelta < 0)
    {
        if (checkbox == false)
        {
            rad--;
        }
        else
        {
            if (picked)
            {
                picked.update();
                picked.rotation.y -= 0.1;
                picked.userData.model.rotation.y -= 0.1; 
                //обновление матрицы поворота объекта/OBB модели
                picked.userData.obb.basis.extractRotation( picked.userData.model.matrixWorld );
            }
        }
    }

    circle.scale.set(rad, 1, rad);
}

function onDocumentMouseMove( event )
{
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    vector.unproject(camera);
    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = ray.intersectObjects(targetList);

    if (intersects.length > 0)
    {
        //console.log(intersects[0]);
        cursor.position.copy(intersects[0].point);
        circle.position.copy(intersects[0].point);
        circle.position.y += 1;

        if (picked)
        {       
            picked.userData.model.position.copy(intersects[0].point);
            picked.update();
        }
    }
}

function onDocumentMouseDown( event ) 
{
    if (checkbox == false)
    {
        isPressed = true;
        document.onmousedown = function(e){
            switch (e.which) {
                case 1:
                    mousedown = 1;
                    break;
                case 3:
                    mousedown = -1;
                    break;
                default:
                    //console.log(e.which);
            }
        };
    }
    else
    {
        //Если уже выбран какая-то параллелипипед, выделение с него будет снято
        if (picked != null)
        {
            picked.material.visible = false
        }
        
        //Построение луча через позиции камеры и курсора мыши
        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        vector.unproject(camera);
        var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        //Поиск пересечений луча и параллелипипедов в списке
        var intersects = ray.intersectObjects( targets );

        //Если было найдено пересечение, параллелипипед становится видимым
        if ( intersects.length > 0 )
        {
            picked = intersects[0].object;
            picked.material.visible = true;
        } else
        {   
            //Если пересечения не найдены, то текущее выделение сбрасывается
            picked = null;
        }
    }
}

function onDocumentMouseUp( event ) 
{
    isPressed = false;
    mousedown = 0;
}

function addCursor(radius)
{
    var geometry = new THREE.CylinderGeometry( 1.5, 0, 5, 64 );
    var cyMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
    var cylinder = new THREE.Mesh(geometry, cyMaterial);
    scene.add(cylinder);

    return cylinder;
}

function addCircle(L)
{
    var dashed_material = new THREE.LineBasicMaterial({
        color: 0xffff00,
    });

    var points = [];

    var k = 360 / L;

    for (var i = 0; i < L; i++)
    {
        var x = Math.cos((i*k) * Math.PI / 180);
        var z = Math.sin((i*k) * Math.PI / 180);

        points.push(new THREE.Vector3(x, 0, z));
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new THREE.LineLoop(geometry, dashed_material);

    line.computeLineDistances();
    line.scale.set(rad, 1, rad);
    scene.add(line);

    return line;
}

function hSphere(k, delta){
    var pos = new THREE.Vector3();
    pos.copy(cursor.position);

    var vertices = geometry.getAttribute('position'); // получение массива вершин

    for (var i = 0; i < vertices.array.length; i += 3)
    {
        var x = vertices.array[i];
        var z = vertices.array[i + 2];
        
        var h = (rad * rad) - (((x - pos.x) * (x - pos.x)) + ((z - pos.z)*(z - pos.z)));

        if (h > 0)
        {
            vertices.array[i + 1] += Math.sqrt(h) * k * delta;
        }
    }
    geometry.setAttribute('position', vertices);

    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
}

function createGUI()
{
    gui = new dat.GUI();
    gui.width = 200;
	
    //Список элементов меню
    params = 
    {
        //Поля с числовыми значениями
        Change: false,
        //Кнопки и функции вызываемые по их нажатию
        addBush: function() { addMeshes(0); },
        addTree: function() { addMeshes(1); },
        addHouse: function() { addMeshes(2); },
        addDel: function() { delMesh(); }
    };

    //Создание вкладки меню        
    var folder1 = gui.addFolder('Transform / Moving');
    //Создание полос прокруток для изменение числовых значений
    var tm = folder1.add( params, 'Change' ).listen();
    folder1.open();

    //Создание вкладки с кнопками
    var folder2 = gui.addFolder('Objects');
    folder2.add( params, 'addBush' ).name("Bush");
    folder2.add( params, 'addTree' ).name("Tree");
    folder2.add( params, 'addHouse' ).name("House");
    folder2.open();

    //Создание вкладки с кнопками
    var folder3 = gui.addFolder('Delete selected object');
    folder3.add( params, 'addDel' ).name("Delete");
    folder3.open();

    //Обработка события "изменение" для полос прокруток
    //В данном примере, изменяется позиция последней добавленной модели
    tm.onChange(function(value) 
    { 
        if (checkbox == false)
        {
            checkbox = true;
            circle.visible = false;
        }
        else
        {
            checkbox = false;
            circle.visible = true;
        }
        console.log(checkbox);
    });
        
    gui.open();
}

function loadModel(path, objName, mtlName, scale)
{
    // функция, выполняемая в процессе загрузки модели (выводит процент загрузки)
    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded' );
        }
    };
    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var onError = function(xhr) { };

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(path);

    // функция загрузки материала
    mtlLoader.load(mtlName, function(materials)
    {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);

        // функция загрузки модели
        objLoader.load(objName, function (object)
        {
            object.position.x = 0;
            object.position.y = 0;
            object.position.z = 0;

            object.scale.set(scale, scale, scale);
            var model = object;	 
            preload.push(object);      
        }, onProgress, onError);
    });
}

function addMeshes(number)
{

        var model = preload[number];

        model.position.x = 130;
        model.position.z = 150;
        
        var st = {};
        st.model = model.clone();;

        //Создание параллелипипеда и установка его по размерам модели
        //var bbox = new THREE.BoundingBoxHelper( st.model, 0x00ff00 ); 
        var bbox = new THREE.BoxHelper( st.model, 0x00ff00 );  

        bbox.update();

        //Изначально параллелипипед невидим
        bbox.material.visible = false;
        
        //структура OBB:
        //basis - оси локальной системы координат
        //halfSize - половина размера стороны AABB
        //position - центр AABB
        var obb = {};
        
        obb.basis = new THREE.Matrix4();
        obb.halfSize = new THREE.Vector3();
        obb.position = new THREE.Vector3();
        
        var scale, aabb, w;

	    //обновление матрицы мира объекта (на всякий случай)
	    st.model.updateMatrixWorld();

	    //получение данных AABB
	    aabb = bbox.box;
                
	    //получение матрицы поворота объекта
	    obb.basis.extractRotation( st.model.matrixWorld );

        st.obb = obb;
        bbox.userData = st;

        //Добавление параллелипипеда и модели в сцену        
        scene.add(bbox);
        scene.add(bbox.userData.model);
        
        //Добавление параллелипипеда в список моделей, с которыми будет проверяться пересечение
        targets.push(bbox);       
    //}   
}

function delMesh()
{
    for(var i = 0; i < targets.length; i++)
    {
        if (picked == targets[i])
        {
            scene.remove(targets[i].userData.model);
            scene.remove(targets[i]);
            targets.splice(1, i);
        }
    }
}

function intersect(ob1, ob2)
{
    var xAxisA = new THREE.Vector3();

    var yAxisA = new THREE.Vector3();
    var zAxisA = new THREE.Vector3();

    var xAxisB = new THREE.Vector3();
    var yAxisB = new THREE.Vector3();
    var zAxisB = new THREE.Vector3();

    var translation = new THREE.Vector3();

    var vector = new THREE.Vector3();
		
    var axisA = [];
    var axisB = [];
    var rotationMatrix = [ [], [], [] ];
    var rotationMatrixAbs = [ [], [], [] ];

    var _EPSILON = 1e-3;
    
    var halfSizeA, halfSizeB;
    var t, i;
        
    ob1.obb.basis.extractBasis( xAxisA, yAxisA, zAxisA );
    ob2.obb.basis.extractBasis( xAxisB, yAxisB, zAxisB );
       
    // push basis vectors into arrays, so you can access them via indices
    axisA.push( xAxisA, yAxisA, zAxisA );
    axisB.push( xAxisB, yAxisB, zAxisB );

    // get displacement vector
    vector.subVectors( ob2.obb.position, ob1.obb.position );
    // express the translation vector in the coordinate frame of the current
    // OBB (this)
    for ( i = 0; i < 3; i++ )
    {
	translation.setComponent( i, vector.dot( axisA[ i ] ) );
    }

    // generate a rotation matrix that transforms from world space to the
    // OBB's coordinate space
    for ( i = 0; i < 3; i++ )
    {
	for ( var j = 0; j < 3; j++ )
	{
            rotationMatrix[ i ][ j ] = axisA[ i ].dot( axisB[ j ] );
            rotationMatrixAbs[ i ][ j ] = Math.abs( rotationMatrix[ i ][ j ] ) + _EPSILON;
	}
    }

    // test the three major axes of this OBB
    for ( i = 0; i < 3; i++ )
    {
        vector.set( rotationMatrixAbs[ i ][ 0 ], rotationMatrixAbs[ i ][ 1 ], rotationMatrixAbs[ i ][ 2 ] );

	halfSizeA = ob1.obb.halfSize.getComponent( i );
	halfSizeB = ob2.obb.halfSize.dot( vector );
    

	if ( Math.abs( translation.getComponent( i ) ) > halfSizeA + halfSizeB )
	{
            return false;
	}
    }

    // test the three major axes of other OBB
    for ( i = 0; i < 3; i++ )
    {
	vector.set( rotationMatrixAbs[ 0 ][ i ], rotationMatrixAbs[ 1 ][ i ], rotationMatrixAbs[ 2 ][ i ] );

	halfSizeA = ob1.obb.halfSize.dot( vector );
	halfSizeB = ob2.obb.halfSize.getComponent( i );

	vector.set( rotationMatrix[ 0 ][ i ], rotationMatrix[ 1 ][ i ], rotationMatrix[ 2 ][ i ] );
	t = translation.dot( vector );

	if ( Math.abs( t ) > halfSizeA + halfSizeB )
	{
            return false;
	}
    }

    // test the 9 different cross-axes

    // A.x <cross> B.x
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 1 ];

    t = translation.z * rotationMatrix[ 1 ][ 0 ] - translation.y * rotationMatrix[ 2 ][ 0 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
	return false;
    }

    // A.x < cross> B.y
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 0 ];

    t = translation.z * rotationMatrix[ 1 ][ 1 ] - translation.y * rotationMatrix[ 2 ][ 1 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    	return false;
    }

    // A.x <cross> B.z
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 1 ] + ob2.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 0 ];

    t = translation.z * rotationMatrix[ 1 ][ 2 ] - translation.y * rotationMatrix[ 2 ][ 2 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    	return false;
    }

    // A.y <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 1 ];

    t = translation.x * rotationMatrix[ 2 ][ 0 ] - translation.z * rotationMatrix[ 0 ][ 0 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    	return false;
    }

    // A.y <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 0 ];

    t = translation.x * rotationMatrix[ 2 ][ 1 ] - translation.z * rotationMatrix[ 0 ][ 1 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
	return false;
    }

    // A.y <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob2.obb.halfSize.y * rotationMatrixAbs[ 1 ][ 0 ];

    t = translation.x * rotationMatrix[ 2 ][ 2 ] - translation.z * rotationMatrix[ 0 ][ 2 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
	return false;
    }

    // A.z <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 0 ] + ob1.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 2 ][ 1 ];

    t = translation.y * rotationMatrix[ 0 ][ 0 ] - translation.x * rotationMatrix[ 1 ][ 0 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
	return false;
    }

    // A.z <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob1.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 2 ][ 0 ];

    t = translation.y * rotationMatrix[ 0 ][ 1 ] - translation.x * rotationMatrix[ 1 ][ 1 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
	return false;
    }

    // A.z <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob1.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob2.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 0 ];

    t = translation.y * rotationMatrix[ 0 ][ 2 ] - translation.x * rotationMatrix[ 1 ][ 2 ];

    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
	return false;
    }

    // no separating axis exists, so the two OBB don't intersect
    return true;
}