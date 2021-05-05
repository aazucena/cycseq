:set -XOverloadedStrings
:set prompt ""

import Sound.Tidal.Context

import System.IO (hSetEncoding, stdout, utf8)

import qualified Control.Concurrent.MVar as MV
import qualified Sound.Tidal.Tempo as Tempo
import qualified Sound.OSC.FD as O

hSetEncoding stdout utf8

-- total latency = oLatency + cFrameTimespan
tidal <- startTidal (superdirtTarget {oLatency = 0.1, oAddress = "127.0.0.1", oPort = 57120}) (defaultConfig {cFrameTimespan = 1/20})

:{
let only = (hush >>)
    p = streamReplace tidal
    hush = streamHush tidal
    panic = do hush
               once $ sound "superpanic"
    list = streamList tidal
    mute = streamMute tidal
    unmute = streamUnmute tidal
    unmuteAll = streamUnmuteAll tidal
    solo = streamSolo tidal
    unsolo = streamUnsolo tidal
    once = streamOnce tidal
    first = streamFirst tidal
    asap = once
    nudgeAll = streamNudgeAll tidal
    all = streamAll tidal
    resetCycles = streamResetCycles tidal
    setcps = asap . cps
    getcps = do tempo <- MV.readMVar $ sTempoMV tidal
                return $ Tempo.cps tempo
    getnow = do tempo <- MV.readMVar $ sTempoMV tidal
                now <- O.time
                return $ fromRational $ Tempo.timeToCycles tempo now
    xfade i = transition tidal True (Sound.Tidal.Transition.xfadeIn 4) i
    xfadeIn i t = transition tidal True (Sound.Tidal.Transition.xfadeIn t) i
    histpan i t = transition tidal True (Sound.Tidal.Transition.histpan t) i
    wait i t = transition tidal True (Sound.Tidal.Transition.wait t) i
    waitT i f t = transition tidal True (Sound.Tidal.Transition.waitT f t) i
    jump i = transition tidal True (Sound.Tidal.Transition.jump) i
    jumpIn i t = transition tidal True (Sound.Tidal.Transition.jumpIn t) i
    jumpIn' i t = transition tidal True (Sound.Tidal.Transition.jumpIn' t) i
    jumpMod i t = transition tidal True (Sound.Tidal.Transition.jumpMod t) i
    mortal i lifespan release = transition tidal True (Sound.Tidal.Transition.mortal lifespan release) i
    interpolate i = transition tidal True (Sound.Tidal.Transition.interpolate) i
    interpolateIn i t = transition tidal True (Sound.Tidal.Transition.interpolateIn t) i
    clutch i = transition tidal True (Sound.Tidal.Transition.clutch) i
    clutchIn i t = transition tidal True (Sound.Tidal.Transition.clutchIn t) i
    anticipate i = transition tidal True (Sound.Tidal.Transition.anticipate) i
    anticipateIn i t = transition tidal True (Sound.Tidal.Transition.anticipateIn t) i
    forId i t = transition tidal False (Sound.Tidal.Transition.mortalOverlay t) i
    d1 = p 1 . (|< orbit 0)
    d2 = p 2 . (|< orbit 1)
    d3 = p 3 . (|< orbit 2)
    d4 = p 4 . (|< orbit 3)
    d5 = p 5 . (|< orbit 4)
    d6 = p 6 . (|< orbit 5)
    d7 = p 7 . (|< orbit 6)
    d8 = p 8 . (|< orbit 7)
    d9 = p 9 . (|< orbit 8)
    d10 = p 10 . (|< orbit 9)
    d11 = p 11 . (|< orbit 10)
    d12 = p 12 . (|< orbit 11)
    d13 = p 13
    d14 = p 14
    d15 = p 15
    d16 = p 16
:}

:{
let setI = streamSetI tidal
    setF = streamSetF tidal
    setS = streamSetS tidal
    setR = streamSetR tidal
    setB = streamSetB tidal
:}


-- All functions are from: https://club.tidalcycles.org/t/sharing-custom-functions/1032
-- My functions are gate, fastgate, gateWith, fastgateWith, gater, rscale, pingpong, ipingpong, pingpongMod
:{
    n `nroot` x = x ** (1 / fromIntegral n)
    nrootFuncs p f = f (fmap (12 `nroot` 2 **) (p))
    speed' p = nrootFuncs p speed
    accelerate' p = nrootFuncs p accelerate
    psrate = pF "psrate"
    psrate' p = nrootFuncs p psrate
    dly p1 p2 = delaytime p1 # delayfeedback p2 # delay 1
    roundy p =  (fromIntegral . round) <$> p
    stepr n r1 r2 f = segment n $ range r1 r2 $ f
    stepr' n r1 r2 f = roundy $ stepr n r1 r2 f
    myarp sc r2 f = scale sc (stepr' 32 0 r2 f)
    linput = pI "linput"
    lrec = pI "lrec"
    lnr = pI "lnr"
    capply condpat effectpat = every (fmap (\x -> if x > 0 then 1 else 0) (discretise 1 condpat)) effectpat
    looper cc nr input= capply (cF 0 cc) (const $ slow 1 $ s "rloop" # lrec "<1 0>" # lnr nr # linput input) $ s "rloop" # lrec "0" # lnr nr
    sinosc  min max frq = (fast frq $ range min max sine)   
    triosc  min max frq = (fast frq $ range min max tri)
    sqrosc  min max frq = (fast frq $ range min max square)
    sawosc  min max frq = (fast frq $ range min max saw)
    randosc min max = (range min max rand)
    randscale sc n f = (|+ note (scale sc (irand n))) f
    invnote n = 0-n 
    invnote' axis x = (2*axis) - x
    plyCato num amt = plyWith num (|* legato amt)
    plyDown num amt = plyWith num (|* gain amt)
    parabolamod = listToPat([x^2 | x<-[0.1,0.12..0.5]])
    recparabola = listToPat([1/x^2 | x<-[0.1,0.12..0.5]])
    linmod = listToPat([0.4*x+0.4 | x<-[0.1,0.12..0.4]])
    sinemod = listToPat([sin(0.4*x+0.4) | x<-[0.1,0.12..0.4]])
    cosmod = listToPat([cos(0.4*x+0.4) | x<-[0.1,0.12..0.4]])
    downstairs = listToPat([x | x<-[1 ,1, 0.8 ,0.8 ,0.6, 0.6, 0.4, 0.4, 0.2, 0.2, 0, 0 ]])
    odds y = listToPat([2*x+1 | x<-[1,2..y]]) -- odd numbers
    evens y = listToPat([2*x | x<-[1,2..y]]) -- even numbers
    -- rslice x p = slice x (segment (toTime <$> x) $ ((>>= irand) x)) $ p
    -- rsplice x p = splice x (segment (toTime <$> x) $ ((>>= irand) x)) $ p
    gate m n x p = slow m $ (# legato n) $ slice x (run x) $ p
    fastgate m n x p = fast m $ (# legato n) $ slice x (run x) $ p
    gateWith m n x f p = slow m $ (|* legato n) $ f $ slice x (run x) $ p
    fastgateWith m n x f p = fast m $ (|* legato n) $ f $ slice x (run x) $ p
    gater m n x p = fast m $ (# legato n) $ randslice x $ p
    rscale = (choose ["minPent", "majPent", "ritusen", "egyptian", "kumai", "hirajoshi", "iwato", "chinese", "indian", "pelog", 
                        "prometheus", "scriabin", "gong", "shang", "jiao", "zhi", "yu", "whole", "augmented", "augmented2", "hexMajor7", 
                        "hexDorian", "hexPhrygian", "hexSus", "hexMajor6", "hexAeolian", "major", "ionian", "dorian", "phrygian",
                        "lydian", "mixolydian", "aeolian", "minor", "locrian", "harmonicMinor", "harmonicMajor", "melodicMinor",
                        "melodicMinorDesc", "melodicMajor", "bartok", "hindu", "todi", "purvi", "marva", "bhairav", "ahirbhairav", 
                        "superLocrian", "romanianMinor", "hungarianMinor", "neapolitanMinor", "enigmatic", "spanish", 
                        "leadingWhole", "lydianMinor", "neapolitanMajor", "locrianMajor", "diminished", "diminished2", "chromatic"
                        ])
    pingpong n = (# pan (range 0 1 $ fast n square))
    ipingpong n = (# pan (range 1 0 $ fast n square))
    pingpongMod x y n = (# pan (range x y $ fast n square))
:}

sock <- carabiner tidal 4 (0) 

:set prompt "tidal> "
:set prompt-cont ""

:set prompt "tidal> "

