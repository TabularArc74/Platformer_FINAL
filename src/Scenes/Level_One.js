class Level_One extends Phaser.Scene {
    constructor() {
        super("levelOne");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 10000;
        this.DRAG = 10000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.userControl = true;
        this.counter = 0;
        this.timer1 = 0;
    }

    create() {
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("industrial_tileset", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
        this.backLayer = this.map.createLayer("Background", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.endZone = this.map.createFromObjects("Objects", {
            name: "ending"
        });

        this.crates = this.map.createFromObjects("Objects", {
            name: "collect",
            key: "tilemap_sheet",
            frame: 61
        });
        this.light_1 = this.map.createFromObjects("Objects", {
            name: "light_1",
            key: "tilemap_sheet",
            frame: 64
        });
        this.light_2 = this.map.createFromObjects("Objects", {
            name: "light_2",
            key: "tilemap_sheet",
            frame: 64
        });
        this.light_3 = this.map.createFromObjects("Objects", {
            name: "light_3",
            key: "tilemap_sheet",
            frame: 64
        });
        
        /*this.spawn_point = this.map.createFromObjects("Objects", {
            name: "spawn_point"
        });*/

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.endZone, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.crates, Phaser.Physics.Arcade.STATIC_BODY);

        this.crateGroup = this.add.group(this.crates);
        this.endLevel = this.add.group(this.endZone);
        

        // set up player avatar
        //470 50
        my.sprite.player = this.physics.add.sprite(50, 1050, "platformer_characters", "tile_0000.png");
        //my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setMaxVelocity(225, 1000000);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);


        my.vfx.crateCollect = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_07.png', 'star_08.png'],
            scale: {start: 0.03, end: 0.1},
            lifespan: 350,
            alpha: {start: 1, end: 0.1},
            stopAfter: 4
        });
        my.vfx.crateCollect.stop();

        this.physics.add.overlap(my.sprite.player, this.crateGroup, (obj1, obj2) => {
            obj2.destroy();
            my.vfx.crateCollect.startFollow(obj2, 0, 0, false);
            my.vfx.crateCollect.start();
            this.collect.play();
        });

        this.physics.add.overlap(my.sprite.player, this.endLevel, (obj1, obj2) => {
            this.userControl = false;
            var txt = this.add.text(200, 100, 'LEVEL\n COMPLETE');
            my.sprite.player.body.setVelocityX(0);
            my.sprite.player.body.setVelocityY(-100);
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
            console.log("Level Ended");
        });
        

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // movement vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            //add random: true
            scale: {start: 0.02, end: 0.08},
            //maxAliveParticles: 50,
            lifespan: 200,
            //gravityY: 50,
            alpha: {start: 0.5, end: 0.1}, 
        });
        my.vfx.walking.stop();


        //jumping
        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['trace_01.png', 'trace_02.png'],
            //add random: true
            scale: {start: 0.2, end: 0.03},
            //maxAliveParticles: 1,
            lifespan: 400,
            //gravityY: 50,
            alpha: {start: 1, end: 0.1}, 
        });
        my.vfx.jumping.stop();
        

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.jump = this.sound.add('jump');
        this.collect = this.sound.add('collect');

    }

    update() {

        if(cursors.left.isDown) {
            if(this.userControl){
                my.sprite.player.setAccelerationX(-this.ACCELERATION);
                my.sprite.player.resetFlip();
                my.sprite.player.anims.play('walk', true);
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

                my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

                // Only play smoke effect if touching the ground

                if (my.sprite.player.body.blocked.down) {
                    my.vfx.walking.start();
                }
            }
        } else if(cursors.right.isDown) {
            if(this.userControl){
                my.sprite.player.setAccelerationX(this.ACCELERATION);
                my.sprite.player.setFlip(true, false);
                my.sprite.player.anims.play('walk', true);
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
                my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
                // Only play smoke effect if touching the ground
                if (my.sprite.player.body.blocked.down) {
                    my.vfx.walking.start();
                }
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }


        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(this.userControl){
            if(!my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('jump');
            }
            if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight-10, false);
                //my.vfx.jumping.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
                my.vfx.walking.stop();
                my.vfx.jumping.start();
                this.timer1 = 10;
                //VERY LOUD
                this.jump.play();
            }
            
        }

        if(this.timer1 > 0){
            this.timer1--;
            if(this.timer1 == 0){
                my.vfx.jumping.stop();
            }
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}