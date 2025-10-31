/**
 * Calliope Mini V3 + MotionKit V2 (Maqueen-kompatibel)
 */
/**
 * Linefollower mit Ultraschall-Stopp, Unterbodenbeleuchtung und sanftem Wiederanfahren
 */
/**
 * Taste A = Start/Stop
 */
// Zeit zwischen Beschleunigungsschritten (ms)
// ---------- Start / Stop ----------
input.onButtonPressed(Button.A, function () {
    running = !(running)
    if (running) {
        obstacle = false
        basic.showIcon(IconNames.Triangle)
        // Grün
        maqueen.setColor(0x00ff00)
    } else {
        maqueen.motorStop(maqueen.Motors.All)
        basic.showIcon(IconNames.Square)
        // LEDs aus
        maqueen.setColor(0x000000)
    }
})
// ---------- Sanftes Beschleunigen ----------
function smoothStart (targetSpeed: number) {
    for (let speed = 0; speed <= targetSpeed; speed += accelStep) {
        maqueen.motorRun(maqueen.Motors.All, maqueen.Dir.CW, speed)
        maqueen.setColor(0x00ff00)
        basic.pause(accelDelay)
    }
}
let rightSpeed = 0
let leftSpeed = 0
let correction = 0
let error = 0
let rightBright = false
let leftBright = false
let distance = 0
let obstacle = false
let running = false
// Grundgeschwindigkeit (0–255)
let baseSpeed = 60
// Regelverstärkung
let Kp = 25
// Stopp-Distanz in cm
let stopDistance = 15
// Schrittgröße beim Beschleunigen
let accelStep = 10
// Zeit zwischen Beschleunigungsschritten (ms)
let accelDelay = 100
// ---------- Hauptprogramm ----------
basic.forever(function () {
    if (running) {
        distance = maqueen.ultrasonic(maqueen.DistanceUnit.Centimeters)
        // --- Hindernis erkannt ---
        if (distance > 0 && distance < stopDistance) {
            if (!(obstacle)) {
                obstacle = true
                maqueen.motorStop(maqueen.Motors.All)
                // Rot
                maqueen.setColor(0xff0000)
                basic.showIcon(IconNames.No)
                music.playTone(523, music.beat(BeatFraction.Quarter))
            }
            return
        } else if (obstacle && distance >= stopDistance) {
            // --- Weg frei: sanftes Wiederanfahren ---
            obstacle = false
            basic.showIcon(IconNames.Triangle)
            smoothStart(baseSpeed)
        }
        // --- Linienverfolgung ---
        if (!(obstacle)) {
            leftBright = maqueen.readPatrol(maqueen.Patrol.PatrolLeft, maqueen.Brightness.Bright)
            rightBright = maqueen.readPatrol(maqueen.Patrol.PatrolRight, maqueen.Brightness.Bright)
            if (leftBright && !(rightBright)) {
                // Linie unter linkem Sensor → nach rechts
                error = -1
                basic.showArrow(ArrowNames.East)
                // Blau
                maqueen.setColor(0x0000ff)
            } else if (!(leftBright) && rightBright) {
                // Linie unter rechtem Sensor → nach links
                error = 1
                basic.showArrow(ArrowNames.West)
                // Gelb
                maqueen.setColor(0xffff00)
            } else if (!(leftBright) && !(rightBright)) {
                // Linie verloren → langsam suchen
                error = 0
                basic.showIcon(IconNames.Confused)
                // Lila
                maqueen.setColor(0xff00ff)
                maqueen.motorRun(maqueen.Motors.All, maqueen.Dir.CW, 30)
                return
            } else {
                // Beide hell → Geradeaus
                error = 0
                basic.showArrow(ArrowNames.North)
                // Grün
                maqueen.setColor(0x00ff00)
            }
            // --- Regelung ---
            correction = Kp * error
            leftSpeed = baseSpeed - correction
            rightSpeed = baseSpeed + correction
            leftSpeed = Math.constrain(leftSpeed, 0, 255)
            rightSpeed = Math.constrain(rightSpeed, 0, 255)
            maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, leftSpeed)
            maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, rightSpeed)
        }
    } else {
        maqueen.motorStop(maqueen.Motors.All)
    }
    basic.pause(20)
})
