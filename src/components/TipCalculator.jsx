// TipCalculator (updated with numeric-span fix, killTweensOf, debounce)
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "../gsap/MorphSVGPlugin";
import SVG from "./Svg";

import dollarIcon from "../assets/images/icon-dollar.svg";
import personIcon from "../assets/images/icon-person.svg";

gsap.registerPlugin(MorphSVGPlugin);

export default function TipCalculator() {
  const tipOptions = [5, 10, 15, 25, 50];
  const [selectedTip, setSelectedTip] = useState(null);

  // GSAP refs
  const svgRef1 = useRef(null);
  const svgRef2 = useRef(null);

  // Stagger animation refs
  const containerRef = useRef(null);
  const inputsRef = useRef([]);
  const tipButtonsRef = useRef([]);
  const resultsRef = useRef(null);

  // Rolling numbers refs (now numeric-only spans)
  const tipAmountRef = useRef(null);
  const totalAmountRef = useRef(null);

  const [tipPerPerson, setTipPerPerson] = useState(0);
  const [totalPerPerson, setTotalPerPerson] = useState(0);

  const {
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const watchBill = watch("bill");
  const watchPeople = watch("people");
  const watchCustomTip = watch("customTip");

  /* -------------------------
     Debounce utility
  -------------------------- */
  function useDebounce(callback, delay = 200) {
    const timeoutRef = useRef(null);

    return (...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  }

  /* -------------------------
     GSAP number tween (fixed)
  -------------------------- */
  const animateNumber = (element, targetValue, duration = 1.5) => {
    if (!element) return;

    const target = Number(targetValue) || 0;

    // Kill any previous tweens
    gsap.killTweensOf(element);
    gsap.killTweensOf(element._gsapNumberTweenObj);

    const start = parseFloat(element.innerText.replace(/,/g, "")) || 0;

    const tweenObj = { val: start };
    element._gsapNumberTweenObj = tweenObj;

    gsap.to(tweenObj, {
      val: target,
      duration,
      ease: "power2.out",
      onUpdate() {
        element.innerText = tweenObj.val.toFixed(2);
      },
      onComplete() {
        element.innerText = target.toFixed(2);
      },
    });
  };

  /* -------------------------
     SVG morph anims
  -------------------------- */
  const runMorph = () => {
    gsap.to([svgRef1.current, svgRef2.current], {
      duration: 1.2,
      morphSVG: "#circle",
      ease: "power2.inOut",
    });
  };

  const reverseMorph = () => {
    gsap.to([svgRef1.current, svgRef2.current], {
      duration: 1,
      morphSVG: "#checkmark",
      ease: "power2.inOut",
    });
  };

  /* -------------------------
     Elastic bounce for buttons
  -------------------------- */
  const elasticBounce = (element) => {
    if (!element) return;

    gsap.killTweensOf(element);

    const tl = gsap.timeline();

    tl.to(element, {
      scale: 0.95,
      duration: 0.1,
      ease: "power2.in",
    })
      .to(element, {
        scale: 1.1,
        duration: 0.2,
        ease: "power2.out",
      })
      .to(element, {
        scale: 1,
        duration: 0.3,
        ease: "elastic.out(1.2, 0.5)",
      });
  };

  const handleTipSelect = (tip, element) => {
    setSelectedTip(tip);
    elasticBounce(element);
  };

  /* -------------------------
     Debounced calculation
  -------------------------- */
  const runCalculation = () => {
    const bill = Number(watchBill);
    const people = Number(watchPeople);
    const tipPercent =
      selectedTip !== null ? selectedTip : Number(watchCustomTip) || 0;

    if (bill > 0 && people > 0) {
      const tipAmount = (bill * (tipPercent / 100)) / people;
      const totalAmount = bill / people + tipAmount;

      animateNumber(tipAmountRef.current, tipAmount, 1.2);
      animateNumber(totalAmountRef.current, totalAmount, 1.5);

      setTipPerPerson(tipAmount);
      setTotalPerPerson(totalAmount);

      runMorph();
    } else {
      animateNumber(tipAmountRef.current, 0, 0.8);
      animateNumber(totalAmountRef.current, 0, 0.8);
    }
  };

  const debouncedCalc = useDebounce(runCalculation, 200);

  useEffect(() => {
    debouncedCalc();
  }, [watchBill, watchPeople, watchCustomTip, selectedTip]);

  /* -------------------------
     Mount stagger animation
  -------------------------- */
  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      containerRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
    )
      .fromTo(
        inputsRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out" },
        "-=0.3",
      )
      .fromTo(
        tipButtonsRef.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.7)",
        },
        "-=0.2",
      )
      .fromTo(
        resultsRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
        "-=0.2",
      );

    return () => tl.kill();
  }, []);

  /* -------------------------
     Reset
  -------------------------- */
  const handleReset = () => {
    reset();
    setSelectedTip(null);

    animateNumber(tipAmountRef.current, 0, 0.8);
    animateNumber(totalAmountRef.current, 0, 0.8);

    setTipPerPerson(0);
    setTotalPerPerson(0);

    reverseMorph();
  };

  /* -------------------------
     Add refs
  -------------------------- */
  const addToInputsRef = (el) => {
    if (el && !inputsRef.current.includes(el)) {
      inputsRef.current.push(el);
    }
  };

  const addToTipButtonsRef = (el) => {
    if (el && !tipButtonsRef.current.includes(el)) {
      tipButtonsRef.current.push(el);
    }
  };

  /* -------------------------
     JSX
  -------------------------- */
  return (
    <div
      ref={containerRef}
      className='flex flex-col md:flex-row gap-8 w-full max-w-[700px] bg-white text-black rounded-3xl p-8 relative opacity-0'
    >
      {/* GSAP SVG */}
      <SVG svgRef={svgRef1} className='-top-12 -left-10' />

      <div className='w-full md:w-1/2'>
        <div ref={addToInputsRef}>
          <InputField
            label='Bill'
            icon={dollarIcon}
            register={register("bill", { required: true, min: 1 })}
            error={errors.bill}
          />
        </div>

        <div className='mb-8'>
          <label className='text-sm text-neutral-gray font-semibold'>
            Select Tip %
          </label>

          <div className='grid grid-cols-3 gap-3 my-3'>
            {tipOptions.map((tip) => (
              <div key={tip} ref={addToTipButtonsRef} className='opacity-0'>
                <TipButton
                  tip={tip}
                  selectedTip={selectedTip}
                  onSelect={handleTipSelect}
                />
              </div>
            ))}

            <div ref={addToTipButtonsRef} className='opacity-0'>
              <input
                type='number'
                {...register("customTip")}
                placeholder='Custom'
                onFocus={() => setSelectedTip(null)}
                className='p-3 text-lg tracking-wide rounded-md font-bold text-primary text-center bg-neutral-light outline-none focus:ring-2 focus:ring-accent w-full'
              />
            </div>
          </div>
        </div>

        <div ref={addToInputsRef}>
          <InputField
            label='Number of People'
            icon={personIcon}
            register={register("people", { required: true, min: 1 })}
            error={errors.people}
          />
        </div>
      </div>

      <div
        ref={resultsRef}
        className='flex flex-col justify-between w-full md:w-1/2 bg-primary text-white p-8 rounded-xl opacity-0'
      >
        <div>
          <ResultRow
            label='Tip Amount'
            value={tipPerPerson}
            valueRef={tipAmountRef}
          />
          <ResultRow
            label='Total'
            value={totalPerPerson}
            valueRef={totalAmountRef}
          />
        </div>

        <button
          onClick={handleReset}
          className='bg-accent text-primary font-bold text-lg tracking-wide rounded p-3 hover:bg-neutral-pale hover:cursor-pointer mt-4'
        >
          RESET
        </button>
      </div>

      <SVG svgRef={svgRef2} className='-bottom-12 -right-10' />
    </div>
  );
}

/* ------------------- Reusable Components ------------------- */

function InputField({ label, icon, register, error }) {
  return (
    <div className='mb-8'>
      <label className='text-base tracking-wide text-neutral-gray font-semibold uppercase'>
        {label} *
      </label>

      <div className='relative mt-2'>
        <img
          src={icon}
          alt=''
          className='absolute left-4 top-1/2 -translate-y-1/2 w-4'
        />

        <input
          type='number'
          placeholder='0'
          {...register}
          className='w-full bg-neutral-light p-2 pl-12 pr-3 text-right text-lg tracking-wide text-primary rounded-md font-bold outline-none focus:ring-2 focus:ring-accent'
        />
      </div>

      {error && (
        <span className='text-red-500 text-xs tracking-wide'>
          This is a required field
        </span>
      )}
    </div>
  );
}

function TipButton({ tip, selectedTip, onSelect }) {
  const isActive = selectedTip === tip;
  const buttonRef = useRef(null);

  const handleClick = () => {
    onSelect(tip, buttonRef.current);
  };

  return (
    <button
      ref={buttonRef}
      type='button'
      onClick={handleClick}
      aria-pressed={isActive}
      aria-label={`Select ${tip}% tip`}
      className={`p-3 rounded-md font-bold text-lg tracking-wide transition hover:cursor-pointer w-full relative overflow-hidden ${
        isActive
          ? "bg-accent text-primary outline-2 outline-accent"
          : "bg-primary text-white hover:bg-hover-accent-light hover:text-hover-dark-text"
      }`}
    >
      {tip}%
      <span className='absolute inset-0 bg-white opacity-0 transition-opacity duration-200'></span>
    </button>
  );
}

function ResultRow({ label, value, valueRef }) {
  return (
    <div className='flex justify-between mb-10'>
      <div>
        <p className='text-lg tracking-wide font-semibold'>{label}</p>
        <p className='text-sm tracking-wide text-neutral-gray'>/ person</p>
      </div>

      <p className='text-4xl tracking-wide font-bold text-accent'>
        <span aria-hidden>$</span>
        <span ref={valueRef} style={{ marginLeft: 6 }}>
          {value.toFixed(2)}
        </span>
      </p>
    </div>
  );
}
