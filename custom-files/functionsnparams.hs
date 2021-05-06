import qualified Sound.Tidal.Chords as Chords
import Data.Maybe
import Sound.Tidal.Utils
import Sound.Tidal.Params
import Control.Applicative


let 
    --tgrund stuff--
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
    --adente shortcuts--
    ac = accelerate
    bs = binshift
    c = choose
    db = degradeBy
    deg = degrade
    degBy = degradeBy
    dis = distort
    ds = distort
    ev = every
    fE = foldEvery
    fa = fast
    g = gain
    h = hurry
    i = id
    m = mute
    o = orbit
    oc = octave
    oa = offadd
    over = superimpose
    sb = sometimesBy
    seg = segment
    shut = const $ silence
    si = superimpose
    sl = slow
    sp = speed
    str = striate
    strBy = striateBy
    u = up
    wl = waveloss
    cyc = (toRational . floor) <$> sig id
    sh t f p = superimpose ((hurry t).f) p
    so t f p = off t ((hurry t).f) p
    -- plays a sample in reverse at speed a every b cycles, timing the playback so it ends exactly when the next cycle begins.
    rinse a b p = ((1/a) <~) $ struct (slow b "t") $ loopAt (-1/a) $ p
    -- rinse' a b c = every b (const $ ((1/a) <~) $ slow a $ loopAt (-1/a) $ sound (c))
    -- rinse a b c d = every b (const $ ((1/a) <~) $ slow a $ loopAt (-1/a) $ sound c # n (irand d))
    adsr a d s r = attack a # decay d # sustain s # release r
    asr a s r = attack a # sustain s # release r
    ar a r = attack a # release r
    del l t f = delay l # delaytime t # delayfeedback f
    scc s c c' = shape s # coarse c # crush c'
    lp c r = cutoff c # resonance r
    bp f q = bandf f # bandq q
    hp c r = hcutoff c # hresonance r
    spa s a = speed s # accelerate a
    gco g c = gain g # cut c
    glo g l = gain g # legato l
    rvb r s = room r # size s
    io i o  = begin i # end o
    eq h b l q = cutoff l # resonance q # bandf b # bandq q # hcutoff h # hresonance q
    tremolo r d = tremolorate r # tremolodepth d
    phaser r d = phaserrate r # phaserdepth d
    lesl l r s = leslie l # lrate r # lsize l
    fshi f n p = fshift f # fshiftnote n # fshiftphase p
    rmod a f s = ring a # ringf f # ringdf s
    oct o s ss = octer o # octersub s # octersubsub ss
    sdel x t = xsdelay x # tsdelay t
    kru k c = krush k # kcutoff c
    scon r i = real r # imag i
    -- booost the bass
    boo = hp 56 0.4
    -- runs of numbers
    r = run
    ri a = rev (r a) -- run inverted
    rodd a = (((r a) + 1) * 2) - 1 -- run of odd numbers
    reven a = ((r a) + 1) * 2 -- run of even numbers
    roddi a = rev (rodd a) -- run of odd inverted
    reveni a = rev (reven a) -- run of even numbers inv erted
    codd a = c $ take a [1,3..] -- choose an odd number
    ceven a = c $ take a [0,2..] -- choose an even number
    -- transitions
    j p n  = jumpIn' p n
    j2 p   = jumpIn' p 2
    j4 p   = jumpIn' p 4
    j8 p   = jumpIn' p 8
    j16 p  = jumpIn' p 16
    xf p n = xfadeIn  p n
    xf2 p  = xfadeIn  p 2
    xf4 p  = xfadeIn  p 4
    xf8 p  = xfadeIn  p 8
    xf16 p = xfadeIn  p 16
    cl p n = clutchIn p n
    cl2 p  = clutchIn p 2
    cl4 p  = clutchIn p 4
    cl8 p  = clutchIn p 8
    cl16 p = clutchIn p 16
    sin = sine
    cos = cosine
    sq  = square
    pulse w = sig $ \t -> if ((snd $ properFraction t) >= w) then 1.0 else 0.0
    pw = pulse
    sinf  f = fast f $ sin -- sine at freq
    cosf  f = fast f $ cos -- cosine at freq
    trif  f = fast f $ tri -- triangle at freq
    sawf  f = fast f $ saw -- saw at freq
    isawf f = fast f $ isaw -- inverted saw at freq
    sqf   f = fast f $ sq -- square at freq
    pwf w f = fast f $ pw w -- pulse at freq
    randf f = fast f $ rand -- rand at freq
    -- range shorthands
    range' from to p = (p*to - p*from) + from
    rg = range
    rg' = range'
    rgx = rangex
    sply n = (ply n).(slow n)
    -- ranged continuous
    rsin i o = rg' i o sin -- ranged' sine
    rcos i o = rg' i o cos -- ranged' cosine
    rtri i o = rg' i o tri -- ranged' triangle
    rsaw i o = rg' i o saw -- ranged' saw
    risaw i o = rg' i o isaw -- ranged' inverted saw
    rsq i o = rg' i o sq -- ranged' square
    rrand i o = rg' i o rand -- ranged' rand
    rxsin i o = rgx i o sin -- ranged' exponential sine
    rxcos i o = rgx i o cos -- ranged' exponential cosine
    rxtri i o = rgx i o tri -- ranged' exponential triangle
    rxsaw i o = rgx i o saw -- ranged' exponential saw
    rxisaw i o = rgx i o isaw -- ranged' exponential inverted saw
    rxsq  i o = rgx i o sq -- ranged' exponential sqaure
    rxpw i o w = rgx i o pw w -- ranged' exponential pulse
    rxrand i o = rgx i o rand -- ranged' exponential rand
    --adente functions--
    bps b = setcps (b/2)
    bpm b = setcps (b/2/120)
    -- ranged continuous at freq
    rsinf i o f = fast f $ rsin i o -- ranged' sine at freq
    rcosf i o f = fast f $ rcos i o -- ranged' cosine at freq
    rtrif i o f = fast f $ rtri i o -- ranged' triangle at freq
    rsawf i o f = fast f $ rsaw i o -- ranged' saw at freq
    risawf i o f = fast f $ risaw i o  -- ranged' inverted saw at freq
    rsqf i o f = fast f $ rsq i o  -- ranged' square at freq
    rrandf i o f = fast f $ rrand i o -- ranged' rand at freq
    rxsinf i o f = fast f $ rxsin i o -- ranged' exponential sine at freq
    rxcosf i o f = fast f $ rxcos i o -- ranged' exponential cosine at freq
    rxtrif i o f = fast f $ rxtri i o -- ranged' exponential triangle at freq
    rxsawf i o f = fast f $ rxsaw i o -- ranged' exponential saw at freq
    rxisawf i o f = fast f $ rxisaw i o -- ranged' exponential inverted saw at freq
    rxsqf i o f = fast f $ rxsq i o -- ranged' exponential square at freq
    rxpwf i o w f = fast f $ rxpw i o w -- ranged' exponential pulse at freq
    rxrandf i o f = fast f $ rxrand i o  -- ranged' exponential random at freq
    -- random shit
    screw l c p = loopAt l $ chop c $ p
    toggle t f p = if (1 == t) then f $ p else id $ p
    tog = toggle
    -- convert continuous functions to floats, ints, melodies x / x' (struct version)
    c2f  t p = seg t $ p -- continuous to floats
    c2f' t p = struct t $ p -- continuous to structured floats
    c2i  t p = quantise 1 $ c2f t p -- continuous to ints
    c2i' t p = quantise 1 $ c2f' t p -- continuous to structured ints
    c2m  s t p = scale s $ round <$> (c2f t p) -- continuous to melodic scale
    c2m' s t p = scale s $ round <$> (c2f' t p) -- continuous to structured melodic scale
    -- harmony
    chordTable = Chords.chordTable
    majork = ["major", "minor", "minor", "major", "major", "minor", "dim7"]
    minork = ["minor", "minor", "major", "minor", "major", "major", "major"]
    doriank = ["minor", "minor", "major", "major", "minor", "dim7", "major"]
    phrygiank = ["minor", "major", "major", "minor", "dim7", "major", "minor"]
    lydiank = ["major", "major", "minor", "dim7", "major", "minor", "minor"]
    mixolydiank = ["major", "minor", "dim7", "major", "minor", "minor", "major"]
    locriank = ["dim7", "major", "minor", "minor", "major", "major", "minor"]
    keyTable = [("major", majork),("minor", minork),("dorian", doriank),("phrygian", phrygiank),("lydian", lydiank),("mixolydian", mixolydiank),("locrian", locriank),("ionian", majork),("aeolian", minork)]
    keyL p = (\name -> fromMaybe [] $ lookup name keyTable) <$> p
    -- | @chord p@ turns a pattern of chord names into a pattern of
    -- numbers, representing note value offsets for the chords
    -- chord :: Num a => Pattern String -> Pattern a
    chord p = flatpat $ Chords.chordL p
    harmonise ch p = scale ch p + chord (flip (!!!) <$> p <*> keyL ch)
    -- mute/solo
    mutePatterns g = mapM (streamMute tidal) g
    muteIntPatterns g = mutePatterns (map show g)
    mutePatterns' s g = mutePatterns (fromJust $ lookup g s)
    unmutePatterns g = mapM (streamUnmute tidal) g
    unmuteIntPatterns g = unmutePatterns (map show g)
    unmutePatterns' s g = unmutePatterns (fromJust $ lookup g s)
    soloPatterns g = mapM (streamSolo tidal) g
    soloPatterns' s g = soloPatterns (fromJust $ lookup g s)
    unsoloPatterns g = mapM (streamUnsolo tidal) g
    unsoloPatterns' s g = unsoloPatterns (fromJust $ lookup g s)
    muteTrackPatterns t g = mapM (streamMute tidal) (map ((t ++ "-") ++) g)
    muteTrackIntPatterns t g = muteTrackPatterns t (map show g)
    muteTrackPatterns' t s g = muteTrackPatterns (fromJust $ lookup (map ((t ++ "-") ++) g) s)
    unmuteTrackPatterns t g = mapM (streamUnmute tidal) (map ((t ++ "-") ++) g)
    unmuteTrackIntPatterns t g = unmuteTrackPatterns t (map show g)
    unmuteTrackPatterns' t s g = unmuteTrackPatterns (fromJust $ lookup (map ((t ++ "-") ++) g) s)
    soloTrackPatterns t g = mapM (streamSolo tidal) (map ((t ++ "-") ++) g)
    soloTrackPatterns' t s g = soloTrackPatterns (fromJust $ lookup (map ((t ++ "-") ++) g) s)
    unsoloTrackPatterns t g = mapM (streamUnsolo tidal) (map ((t ++ "-") ++) g)
    unsoloTrackPatterns' t s g = unsoloTrackPatterns (fromJust $ lookup (map ((t ++ "-") ++) g) s)
    mp  = mutePatterns
    md  = muteIntPatterns
    mp' = mutePatterns'
    ump = unmutePatterns
    umd = unmuteIntPatterns
    ump' = unmutePatterns'
    -- sp = soloPatterns
    -- sp' = soloPatterns'
    usp = unsoloPatterns
    usp' = unsoloPatterns'
    mtp = muteTrackPatterns
    mtd = muteTrackIntPatterns
    mtp' = muteTrackPatterns'
    umtp = unmuteTrackPatterns
    umtd = unmuteTrackIntPatterns
    umtp' = unmuteTrackPatterns'
    stp = soloTrackPatterns
    stp' = soloTrackPatterns'
    ustp = unsoloTrackPatterns
    ustp' = unsoloTrackPatterns'
    -- naming patterns based on tracks
    trackPatternName track patternName = p (track ++ "-" ++ patternName)
    trackIntPattern track patternName = p (track ++ "-" ++ (show patternName))
    tp = trackPatternName
    td = trackIntPattern
    -- named patterns or numbered patterns
    track t mx dn ps p f = td t dn $ f $ (fromJust $ lookup p ps) # g (mx!!(dn-1)) # o (fromList [dn] -1)
    track' t mx ps dn f = td t dn $ f $ (fromJust $ lookup dn ps) # g (mx!!(dn-1)) # o (fromList [dn] -1)
    track'' t mx ps dn f = td t dn $ f $ (ps!!(dn-1)) # g (mx!!(dn-1)) # o (fromList [dn] -1)
    tr = track
    tr' = track'
    tr'' = track''
    -- apply function from map
    f fs n = fromJust $ lookup n fs
    --- Composite functions ------
    transup n p = (|+ note n) $ p --courtesy of Guiot
    transdown n p = (|- note n) $ p --courtesy of Guiot
    degRange x y = degBy (range x y $ rand)
    wchoose pairs = choose $ concatMap (\x -> replicate (fst x) (snd x)) pairs -- weighted choose with the syntax  wchoose [(2,'a'),(1,'b')] <- not sure who wrote this function
-- benjolis params --
    oscA = pF "oscA"
    oscB = pF "oscB"
    runA = pF "runA"
    runB = pF "runB"
    runF = pF "runF"
    res = pF "res"
    freq = pF "freq"
-- olbos --
    note = pF "note" --shared by all my SynthDefs
    tuning = pF "tuning" --shared by all my SynthDefs, SC code by Guiot
    waveblender = pF "waveblender" -- the name of a custom wavetable synthesizer
    wb = "waveblender" --shortcut for the waveblender SynthDef
    xenbass = pF "xenbass" -- a stochastic synth bass
    xenharp = pF "xenharp" -- a stochastic harp sound suitable for melodic fragments
    tubes = pF "tubes" -- a physical model of two resonating tubes, written with Nesso
    depth = pF "depth" --generally used as a detuned chorus effect on SynthDefs (in the tubes synth the range is 0-1, in all others synths it's the frequency amount of displacement)
    pos = pF "pos" --the position of the bufreader in the Waveblender SynthDef, from 0 to 1
    f1 = pF "f1" -- freq control of tube1 of tubes synth (range 3,1000)
    f2 = pF "f2" --freq control of tube2 of tubes synth (range 3, 1000)
    diffract = pF "diffract" --an FFT stretch/shift effect, this param is for stretch
    diffshift = pF "diffshift" -- shift parameter for diffract FFT effect
    diffmix = pF "diffmix" -- dry/wet control diffract FFT effect (0 to 1)
    invert = pF "invert" --fft spectral inversion (from 0 to 1, be careful with high values and use lpf to avoid strong hi freq sounds)
    tanh = pF "tanh" --tanh limiter/distortion (from 1 to n, high number will increase loudness A LOT)
    tantanh = pF "tantanh" --tantanh limiter/distortion (same param as tanh with a different flavour)
    ringshape = pF "ringshape" -- ringmod/waveshaping, the parameter controls frequency
    scr = pF "scr" -- wipe factor of bin scramble effect by Nesso, from 0 to 1
    smooth = pF "smooth" -- sets power of 2 value of fft bins for bin scrambling
    scry = pF "scry" -- amount of random displacement of bin scramble, from 0 to 1
    diff x y z = diffract x # diffshift y # diffmix z
-- chop --
    tilt = pF "tilt"
-- mutable synths --
    timbre = pF "timbre"
    color = pF "color"
    model = pI "model"
    mode = pI "mode"
    tidesshape = pF "tidesshape"
    tidessmooth = pF "tidessmooth"
    slope = pF "slope"
    shift = pF "shift"
    engine = pI "engine"
    harm = pF "harm"
    morph = pF "morph"
    level = pF "level"
    lpgdecay = pF "lpgdecay"
    lpgcolour = pF "lpgcolour"
    lpg d c = lpgdecay d # lpgcolour c
-- mutable effects --
    cloudspitch = pF "cloudspitch"
    cloudspos = pF "cloudspos"
    cloudssize = pF "cloudssize"
    cloudsdens = pF "cloudsdens"
    cloudstex = pF "cloudstex"
    cloudswet = pF "cloudswet"
    cloudsgain = pF "cloudsgain"
    cloudsspread = pF "cloudsspread"
    cloudsrvb = pF "cloudsrvb"
    cloudsfb = pF "cloudsfb"
    cloudsfreeze = pF "cloudsfreeze"
    cloudsmode = pF "cloudsmode"
    cloudslofi = pF "cloudslofi"
    clouds p s d t = cloudsgain 1 # cloudspos p # cloudssize s # cloudsdens d # cloudstex t
    cloudsblend w s f r = cloudsgain 1 # cloudswet w # cloudsspread s # cloudsfb f # cloudsrvb r
    elementspitch = pF "elementspitch"
    elementsstrength = pF "elementsstrength"
    elementscontour = pF "elementscontour"
    elementsbowlevel = pF "elementsbowlevel"
    elementsblowlevel = pF "elementsblowlevel"
    elementsstrikelevel = pF "elementsstrikelevel"
    elementsflow = pF "elementsflow"
    elementsmallet = pF "elementsmallet"
    elementsbowtimb = pF "elementsbowtimb"
    elementsblowtimb = pF "elementsblowtimb"
    elementsstriketimb = pF "elementsstriketimb"
    elementsgeom = pF "elementsgeom"
    elementsbright = pF "elementsbright"
    elementsdamp = pF "elementsdamp"
    elementspos = pF "elementspos"
    elementsspace = pF "elementsspace"
    elementsmodel = pI "elementsmodel"
    elementseasteregg = pI "elementseasteregg"
    mu = pF "mu"
    ringsfreq = pF "ringsfreq"
    ringsstruct = pF "ringsstruct"
    ringsbright = pF "ringsbright"
    ringsdamp = pF "ringsdamp"
    ringspos = pF "ringspos"
    ringsmodel = pF "ringsmodel"
    ringspoly = pI "ringspoly"
    ringsinternal = pI "ringsinternal"
    ringseasteregg = pI "ringseasteregg"
    rings f s b d p = ringsfreq f # ringsstruct s # ringsbright b # ringsdamp d # ringspos p
    ripplescf = pF "ripplescf"
    ripplesreson = pF "ripplesreson"
    ripplesdrive = pF "ripplesdrive"
    ripples c r d = ripplescf c # ripplesreson r # ripplesdrive d
    verbgain = pF "verbgain"
    verbwet = pF "verbwet"
    verbtime = pF "verbtime"
    verbdamp = pF "verbdamp"
    verbhp = pF "verbhp"
    verbfreeze = pI "verbfreeze"
    verbdiff = pF "verbdiff"
    verb w t d h = verbgain 1 # verbwet w # verbtime t # verbdamp d # verbhp h
    warpsalgo = pI "warpsalgo"
    warpstimb = pF "warpstimb"
    warpsosc = pI "warpsosc"
    warpsfreq = pF "warpsfreq"
    warpsvgain = pF "warpsvgain"
    warpseasteregg = pI "warpseasteregg"
    --SIEVES--- implementation of the Xenakis' technique for pattern generation
    restogen value offset amount  = [if (x `mod` value) == 0 then 1 else 0 | x <- [(0 + offset)..(amount + offset)]]
    gen x y z = restogen x y z
    sieveor val1 off1 val2 off2 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvor val1 off1 val2 off2 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveoror val1 off1 val2 off2 val3 off3 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvoror val1 off1 val2 off2 val3 off3 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveand val1 off1 val2 off2 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvand val1 off1 val2 off2 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveandand val1 off1 val2 off2 val3 off3 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvandand val1 off1 val2 off2 val3 off3 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveorand val1 off1 val2 off2 val3 off3 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvorand val1 off1 val2 off2 val3 off3 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveandor val1 off1 val2 off2 val3 off3 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvandor val1 off1 val2 off2 val3 off3 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveororor val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 || (gen val4 off4 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvororor val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 || (gen val4 off4 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveororand val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 && (gen val4 off4 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvororand val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 && (gen val4 off4 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveorandand val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 && (gen val4 off4 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvorandand val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 && (gen val4 off4 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveandandand val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 && (gen val4 off4 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvandandand val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 && (gen val4 off4 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveandandor val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 || (gen val4 off4 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvandandor val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 || (gen val4 off4 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveandoror val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 || (gen val4 off4 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvandoror val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 || (gen val4 off4 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveandorand val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 && (gen val4 off4 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvandorand val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 && (gen val2 off2 d !! x) == 1 || (gen val3 off3 d !! x) == 1 && (gen val4 off4 d !! x) == 1 then False else True | x <- [0..d-1]]
    sieveorandor val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 || (gen val4 off4 d !! x) == 1 then True else False | x <- [0..d-1]]
    sieveinvorandor val1 off1 val2 off2 val3 off3 val4 off4 d = listToPat $ [if (gen val1 off1 d !! x) == 1 || (gen val2 off2 d !! x) == 1 && (gen val3 off3 d !! x) == 1 || (gen val4 off4 d !! x) == 1 then False else True | x <- [0..d-1]]
    sor val1 off1 val2 off2 d p = slow ((fromIntegral d)/8) $ struct (sieveor val1 off1 val2 off2 d) $ p
    soror val1 off1 val2 off2 val3 off3 d p = slow ((fromIntegral d)/8) $ struct (sieveoror val1 off1 val2 off2 val3 off3 d) $ p
    sand val1 off1 val2 off2 d p = slow ((fromIntegral d)/8) $ struct (sieveand val1 off1 val2 off2 d) $ p
    sandand val1 off1 val2 off2 val3 off3 d p = slow ((fromIntegral d)/8) $ struct (sieveandand val1 off1 val2 off2 val3 off3 d) $ p
    sorand val1 off1 val2 off2 val3 off3 d p = slow ((fromIntegral d)/8) $ struct (sieveorand val1 off1 val2 off2 val3 off3 d) $ p
    sandor val1 off1 val2 off2 val3 off3 d p = slow ((fromIntegral d)/8) $ struct (sieveandor val1 off1 val2 off2 val3 off3 d) $ p
    sororor val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveororor val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sororand val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveororand val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sorandand val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveorandand val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sandandand val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveandandand val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sandandor val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveandandor val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sandoror val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveandoror val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sandorand val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveandorand val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sorandor val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveorandor val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sinvor val1 off1 val2 off2 d p = slow ((fromIntegral d)/8) $ struct (sieveinvor val1 off1 val2 off2 d) $ p
    sinvoror val1 off1 val2 off2 val3 off3 d p = slow ((fromIntegral d)/8) $ struct (sieveinvoror val1 off1 val2 off2 val3 off3 d) $ p
    sinvand val1 off1 val2 off2 d p = slow ((fromIntegral d)/8) $ struct (sieveinvand val1 off1 val2 off2 d) $ p
    sinvandand val1 off1 val2 off2 val3 off3 d p = slow ((fromIntegral d)/8) $ struct (sieveinvandand val1 off1 val2 off2 val3 off3 d) $ p
    sinvorand val1 off1 val2 off2 val3 off3 d p = slow ((fromIntegral d)/8) $ struct (sieveinvorand val1 off1 val2 off2 val3 off3 d) $ p
    sinvandor val1 off1 val2 off2 val3 off3 d p = slow ((fromIntegral d)/8) $ struct (sieveinvandor val1 off1 val2 off2 val3 off3 d) $ p
    sinvororor val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveinvororor val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sinvororand val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveinvororand val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sinvorandand val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveinvorandand val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sinvandandand val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveinvandandand val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sinvandandor val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveinvandandor val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sinvandoror val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveinvandoror val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sinvandorand val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveinvandorand val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    sinvorandor val1 off1 val2 off2 val3 off3 val4 off4 d p = slow ((fromIntegral d)/8) $ struct (sieveinvorandor val1 off1 val2 off2 val3 off3 val4 off4 d) $ p
    --Post window functions--
    replicator text1 = [putStr (text1) | x <- replicate 1000 text1]
    flood text2 = sequence_(replicator text2) -- from Kindohm
    --VST Functions and Params--
    vstName = pS "vstName"
    vst name = s "vst" # vstName name
    varg1 = pF "varg1"
    varg2 = pF "varg2"
    varg3 = pF "varg3"
    varg4 = pF "varg4"
    varg5 = pF "varg5"
    varg6 = pF "varg6"
    varg7 = pF "varg7"
    varg8 = pF "varg8"
    varg9 = pF "varg9"
    varg10 = pF "varg10"
    varg11 = pF "varg11"
    varg12 = pF "varg12"
    varg13 = pF "varg13"
    varg14 = pF "varg14"
    varg15 = pF "varg15"
    varg16 = pF "varg16"
    varg17 = pF "varg17"
    varg18 = pF "varg18"
    varg19 = pF "varg19"
    varg20 = pF "varg20"
    varg21 = pF "varg21"
    varg22 = pF "varg22"
    varg23 = pF "varg23"
    varg24 = pF "varg24"
    varg25 = pF "varg25"
    varg26 = pF "varg26"
    varg27 = pF "varg27"
    varg28 = pF "varg28"
    varg29 = pF "varg29"
    varg30 = pF "varg30"
    varg31 = pF "varg31"
    varg32 = pF "varg32"
    varg33 = pF "varg33"
    varg34 = pF "varg34"
    varg35 = pF "varg35"
    varg36 = pF "varg36"
    varg37 = pF "varg37"
    varg38 = pF "varg38"
    varg39 = pF "varg39"
    varg40 = pF "varg40"
    varg41 = pF "varg41"
    varg42 = pF "varg42"
    varg43 = pF "varg43"
    varg44 = pF "varg44"
    varg45 = pF "varg45"
    varg46 = pF "varg46"
    varg47 = pF "varg47"
    varg48 = pF "varg48"
    varg49 = pF "varg49"
    varg50 = pF "varg50"
    varg51 = pF "varg51"
    varg52 = pF "varg52"
    varg53 = pF "varg53"
    varg54 = pF "varg54"
    varg55 = pF "varg55"
    varg56 = pF "varg56"
    varg57 = pF "varg57"
    varg58 = pF "varg58"
    varg59 = pF "varg59"
    varg60 = pF "varg60"
    varg61 = pF "varg61"
    varg62 = pF "varg62"
    varg63 = pF "varg63"
    varg64 = pF "varg64"
    varg65 = pF "varg65"
    varg66 = pF "varg66"
    varg67 = pF "varg67"
    varg68 = pF "varg68"
    varg69 = pF "varg69"
    varg70 = pF "varg70"
    varg71 = pF "varg71"
    varg72 = pF "varg72"
    varg73 = pF "varg73"
    varg74 = pF "varg74"
    varg75 = pF "varg75"
    varg76 = pF "varg76"
    varg77 = pF "varg77"
    varg78 = pF "varg78"
    varg79 = pF "varg79"
    varg80 = pF "varg80"
    varg81 = pF "varg81"
    varg82 = pF "varg82"
    varg83 = pF "varg83"
    varg84 = pF "varg84"
    varg85 = pF "varg85"
    varg86 = pF "varg86"
    varg87 = pF "varg87"
    varg88 = pF "varg88"
    varg89 = pF "varg89"
    varg90 = pF "varg90"
    varg91 = pF "varg91"
    varg92 = pF "varg92"
    varg93 = pF "varg93"
    varg94 = pF "varg94"
    varg95 = pF "varg95"
    varg96 = pF "varg96"
    varg97 = pF "varg97"
    varg98 = pF "varg98"
    varg99 = pF "varg99"
    varg100 = pF "varg100"  
    varg1bus busid pat = (pF "varg1" pat) # (pI "^varg1" busid)
    varg2bus busid pat = (pF "varg2" pat) # (pI "^varg2" busid)
    varg3bus busid pat = (pF "varg3" pat) # (pI "^varg3" busid)
    varg4bus busid pat = (pF "varg4" pat) # (pI "^varg4" busid)
    varg5bus busid pat = (pF "varg5" pat) # (pI "^varg5" busid)
    varg6bus busid pat = (pF "varg6" pat) # (pI "^varg6" busid)
    varg7bus busid pat = (pF "varg7" pat) # (pI "^varg7" busid)
    varg8bus busid pat = (pF "varg8" pat) # (pI "^varg8" busid)
    varg9bus busid pat = (pF "varg9" pat) # (pI "^varg9" busid)
    varg10bus busid pat = (pF "varg10" pat) # (pI "^varg10" busid)
    varg11bus busid pat = (pF "varg11" pat) # (pI "^varg11" busid)
    varg12bus busid pat = (pF "varg12" pat) # (pI "^varg12" busid)
    varg13bus busid pat = (pF "varg13" pat) # (pI "^varg13" busid)
    varg14bus busid pat = (pF "varg14" pat) # (pI "^varg14" busid)
    varg15bus busid pat = (pF "varg15" pat) # (pI "^varg15" busid)
    varg16bus busid pat = (pF "varg16" pat) # (pI "^varg16" busid)
    varg17bus busid pat = (pF "varg17" pat) # (pI "^varg17" busid)
    varg18bus busid pat = (pF "varg18" pat) # (pI "^varg18" busid)
    varg19bus busid pat = (pF "varg19" pat) # (pI "^varg19" busid)
    varg20bus busid pat = (pF "varg20" pat) # (pI "^varg20" busid)
    varg21bus busid pat = (pF "varg21" pat) # (pI "^varg21" busid)
    varg22bus busid pat = (pF "varg22" pat) # (pI "^varg22" busid)
    varg23bus busid pat = (pF "varg23" pat) # (pI "^varg23" busid)
    varg24bus busid pat = (pF "varg24" pat) # (pI "^varg24" busid)
    varg25bus busid pat = (pF "varg25" pat) # (pI "^varg25" busid)
    varg26bus busid pat = (pF "varg26" pat) # (pI "^varg26" busid)
    varg27bus busid pat = (pF "varg27" pat) # (pI "^varg27" busid)
    varg28bus busid pat = (pF "varg28" pat) # (pI "^varg28" busid)
    varg29bus busid pat = (pF "varg29" pat) # (pI "^varg29" busid)
    varg30bus busid pat = (pF "varg30" pat) # (pI "^varg30" busid)
    varg31bus busid pat = (pF "varg31" pat) # (pI "^varg31" busid)
    varg32bus busid pat = (pF "varg32" pat) # (pI "^varg32" busid)
    varg33bus busid pat = (pF "varg33" pat) # (pI "^varg33" busid)
    varg34bus busid pat = (pF "varg34" pat) # (pI "^varg34" busid)
    varg35bus busid pat = (pF "varg35" pat) # (pI "^varg35" busid)
    varg36bus busid pat = (pF "varg36" pat) # (pI "^varg36" busid)
    varg37bus busid pat = (pF "varg37" pat) # (pI "^varg37" busid)
    varg38bus busid pat = (pF "varg38" pat) # (pI "^varg38" busid)
    varg39bus busid pat = (pF "varg39" pat) # (pI "^varg39" busid)
    varg40bus busid pat = (pF "varg40" pat) # (pI "^varg40" busid)
    varg41bus busid pat = (pF "varg41" pat) # (pI "^varg41" busid)
    varg42bus busid pat = (pF "varg42" pat) # (pI "^varg42" busid)
    varg43bus busid pat = (pF "varg43" pat) # (pI "^varg43" busid)
    varg44bus busid pat = (pF "varg44" pat) # (pI "^varg44" busid)
    varg45bus busid pat = (pF "varg45" pat) # (pI "^varg45" busid)
    varg46bus busid pat = (pF "varg46" pat) # (pI "^varg46" busid)
    varg47bus busid pat = (pF "varg47" pat) # (pI "^varg47" busid)
    varg48bus busid pat = (pF "varg48" pat) # (pI "^varg48" busid)
    varg49bus busid pat = (pF "varg49" pat) # (pI "^varg49" busid)
    varg50bus busid pat = (pF "varg50" pat) # (pI "^varg50" busid)
    varg51bus busid pat = (pF "varg51" pat) # (pI "^varg51" busid)
    varg52bus busid pat = (pF "varg52" pat) # (pI "^varg52" busid)
    varg53bus busid pat = (pF "varg53" pat) # (pI "^varg53" busid)
    varg54bus busid pat = (pF "varg54" pat) # (pI "^varg54" busid)
    varg55bus busid pat = (pF "varg55" pat) # (pI "^varg55" busid)
    varg56bus busid pat = (pF "varg56" pat) # (pI "^varg56" busid)
    varg57bus busid pat = (pF "varg57" pat) # (pI "^varg57" busid)
    varg58bus busid pat = (pF "varg58" pat) # (pI "^varg58" busid)
    varg59bus busid pat = (pF "varg59" pat) # (pI "^varg59" busid)
    varg60bus busid pat = (pF "varg60" pat) # (pI "^varg60" busid)
    varg61bus busid pat = (pF "varg61" pat) # (pI "^varg61" busid)
    varg62bus busid pat = (pF "varg62" pat) # (pI "^varg62" busid)
    varg63bus busid pat = (pF "varg63" pat) # (pI "^varg63" busid)
    varg64bus busid pat = (pF "varg64" pat) # (pI "^varg64" busid)
    varg65bus busid pat = (pF "varg65" pat) # (pI "^varg65" busid)
    varg66bus busid pat = (pF "varg66" pat) # (pI "^varg66" busid)
    varg67bus busid pat = (pF "varg67" pat) # (pI "^varg67" busid)
    varg68bus busid pat = (pF "varg68" pat) # (pI "^varg68" busid)
    varg69bus busid pat = (pF "varg69" pat) # (pI "^varg69" busid)
    varg70bus busid pat = (pF "varg70" pat) # (pI "^varg70" busid)
    varg71bus busid pat = (pF "varg71" pat) # (pI "^varg71" busid)
    varg72bus busid pat = (pF "varg72" pat) # (pI "^varg72" busid)
    varg73bus busid pat = (pF "varg73" pat) # (pI "^varg73" busid)
    varg74bus busid pat = (pF "varg74" pat) # (pI "^varg74" busid)
    varg75bus busid pat = (pF "varg75" pat) # (pI "^varg75" busid)
    varg76bus busid pat = (pF "varg76" pat) # (pI "^varg76" busid)
    varg77bus busid pat = (pF "varg77" pat) # (pI "^varg77" busid)
    varg78bus busid pat = (pF "varg78" pat) # (pI "^varg78" busid)
    varg79bus busid pat = (pF "varg79" pat) # (pI "^varg79" busid)
    varg80bus busid pat = (pF "varg80" pat) # (pI "^varg80" busid)
    varg81bus busid pat = (pF "varg81" pat) # (pI "^varg81" busid)
    varg82bus busid pat = (pF "varg82" pat) # (pI "^varg82" busid)
    varg83bus busid pat = (pF "varg83" pat) # (pI "^varg83" busid)
    varg84bus busid pat = (pF "varg84" pat) # (pI "^varg84" busid)
    varg85bus busid pat = (pF "varg85" pat) # (pI "^varg85" busid)
    varg86bus busid pat = (pF "varg86" pat) # (pI "^varg86" busid)
    varg87bus busid pat = (pF "varg87" pat) # (pI "^varg87" busid)
    varg88bus busid pat = (pF "varg88" pat) # (pI "^varg88" busid)
    varg89bus busid pat = (pF "varg89" pat) # (pI "^varg89" busid)
    varg90bus busid pat = (pF "varg90" pat) # (pI "^varg90" busid)
    varg91bus busid pat = (pF "varg91" pat) # (pI "^varg91" busid)
    varg92bus busid pat = (pF "varg92" pat) # (pI "^varg92" busid)
    varg93bus busid pat = (pF "varg93" pat) # (pI "^varg93" busid)
    varg94bus busid pat = (pF "varg94" pat) # (pI "^varg94" busid)
    varg95bus busid pat = (pF "varg95" pat) # (pI "^varg95" busid)
    varg96bus busid pat = (pF "varg96" pat) # (pI "^varg96" busid)
    varg97bus busid pat = (pF "varg97" pat) # (pI "^varg97" busid)
    varg98bus busid pat = (pF "varg98" pat) # (pI "^varg98" busid)
    varg99bus busid pat = (pF "varg99" pat) # (pI "^varg99" busid)
    varg100bus busid pat = (pF "varg100" pat) # (pI "^varg100" busid)
    --Inputed functions--
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
    downstairs = listToPat([x | x<-[1 ,1, 0.8 ,0.8 ,0.6, 0.6, 0.4, 0.4, 0.2, 0.2, 0, 0 ]])
    odds y = listToPat([2*x+1 | x<-[1,2..y]]) -- odd numbers
    evens y = listToPat([2*x | x<-[1,2..y]]) -- even numbers
    rslice x p = slice x (segment (toTime <$> x) $ (irand x)) $ p
    rsplice x p = splice x (segment (toTime <$> x) $ (irand x)) $ p
    --My Functions--
    gate m n x p = slow m $ (# legato n) $ slice x (run x) $ p
    fastgate m n x p = fast m $ (# legato n) $ slice x (run x) $ p
    gateWith m n x f p = slow m $ (|* legato n) $ f $ slice x (run x) $ p
    fastgateWith m n x f p = fast m $ (|* legato n) $ f $ slice x (run x) $ p
    gater m n x p = fast m $ (# legato n) $ randslice x $ p
    pingpong n = (# pan (range 0 1 $ fast n square))
    ipingpong n = (# pan (range 1 0 $ fast n square))
    pingpongMod x y n = (# pan (range x y $ fast n square))


    let rscale = (choose ["minPent", "majPent", "ritusen", "egyptian", "kumai", "hirajoshi", "iwato", "chinese", "indian", "pelog", "prometheus", "scriabin", "gong", "shang", "jiao", "zhi", "yu", "whole", "augmented", "augmented2", "hexMajor7", "hexDorian", "hexPhrygian", "hexSus", "hexMajor6", "hexAeolian", "major", "ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "minor", "locrian", "harmonicMinor", "harmonicMajor", "melodicMinor", "melodicMinorDesc", "melodicMajor", "bartok", "hindu", "todi", "purvi", "marva", "bhairav", "ahirbhairav", "superLocrian", "romanianMinor", "hungarianMinor", "neapolitanMinor", "enigmatic", "spanish", "leadingWhole", "lydianMinor", "neapolitanMajor", "locrianMajor", "diminished", "diminished2", "chromatic"])

    
    --let
        --sinemod = listToPat([sin(0.4*x+0.4) | x<-[0.1,0.12..0.4]])
        --cosmod = listToPat([cos(0.4*x+0.4) | x<-[0.1,0.12..0.4]])     
    