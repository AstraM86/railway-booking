import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { nanoid } from 'nanoid';

import PassengerCard from './PassengerCard/PassengerCard';

import { selectSelectedSeats } from '../../store/slices/seatsSlice';
import { selectPassengers } from '../../store/slices/passengersSlice';
import { selectNumberOfPassengers } from '../../store/slices/numOfpassengersSlice';

import links from '../../data/links';
import passengerTypes from '../SeatsSelection/SelectionBlock/passengerTypes';
import directions from '../../data/directions';

import plus from './img/plus.svg';

import styles from './PassengersSelection.module.scss';

const seatsModifier = (obj) =>
   obj
      .map((el) =>
         el.seats.map((item) => ({
            ...item,
            coachId: el.coachId,
            coachName: el.coachName,
         }))
      )
      .flat();

function PassengersSelection() {
   const navigate = useNavigate();
   const [passArray, setPassArray] = useState([]);
   const seatsDep = useSelector(selectSelectedSeats)[directions.departure];
   const seatsArr = useSelector(selectSelectedSeats)[directions.arrival];
   const passengers = useSelector(selectPassengers);
   const numberOfPassengers = useSelector(selectNumberOfPassengers);

   const seatsDepModified = seatsModifier(seatsDep);
   const seatsArrModified = seatsModifier(seatsArr);

   const unchosenSeatsDep = useMemo(
      () => [...seatsDepModified.filter((el) => el.passengerId === null)],
      [seatsDepModified]
   );
   const unchosenSeatsArr = useMemo(
      () => [...seatsArrModified.filter((el) => el.passengerId === null)],
      [seatsArrModified]
   );

   const unchosenSeats = useMemo(
      () => [...unchosenSeatsDep, ...unchosenSeatsArr],
      [unchosenSeatsArr, unchosenSeatsDep]
   );

   // Максимум по каждому типу (взрослый идёт и туда, и обратно — считаем один раз)
   const maxAdults = Math.max(
      numberOfPassengers[directions.departure]?.adults || 0,
      numberOfPassengers[directions.arrival]?.adults || 0
   );
   const maxChildren = Math.max(
      numberOfPassengers[directions.departure]?.children || 0,
      numberOfPassengers[directions.arrival]?.children || 0
   );
   const maxToddlers = Math.max(
      numberOfPassengers[directions.departure]?.toddlers || 0,
      numberOfPassengers[directions.arrival]?.toddlers || 0
   );
   const totalPassengers = maxAdults + maxChildren + maxToddlers;

   // Тип по позиции карточки: сначала все взрослые, потом дети, потом дети без места
   const getTypeByIndex = (idx) => {
      if (idx < maxAdults) return passengerTypes.adults;
      if (idx < maxAdults + maxChildren) return passengerTypes.children;
      return passengerTypes.toddlers;
   };

   // Инициализируем карточки
   useEffect(() => {
      const initial = [];
      passengers.forEach((pas) => {
         if (!initial.find((item) => item.id === pas.id)) {
            initial.push({ id: pas.id });
         }
      });
      while (initial.length < totalPassengers) {
         initial.push({ id: nanoid() });
      }
      setPassArray(initial);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const clickOnAddPassHandler = () => {
      if (passArray.length < totalPassengers) {
         setPassArray((prev) => [...prev, { id: nanoid() }]);
      }
   };

   const clickOnNextPassHandler = (id) => {
      const index = passArray.findIndex((el) => el.id === id);
      const next = passArray[index + 1];
      if (next) {
         document
            .getElementById(`${next.id}`)
            ?.scrollIntoView({ behavior: 'smooth' });
      }
   };

   const clickOnRemovePassHandler = (id) => {
      setPassArray((prev) => prev.filter((el) => el.id !== id));
   };

   const clickHandler = () => {
      navigate(links.paymentOptions);
   };

   const addPassenger = (
      <button
         type="button"
         className={styles.addPassenger}
         onClick={clickOnAddPassHandler}
      >
         <span className={styles.text}>Добавить пассажира</span>
         <img src={plus} alt="иконка - добавить" />
      </button>
   );

   // Кнопка «Далее» активна только когда все места заняты и все пассажиры заполнены
   const isReady =
      unchosenSeats.length === 0 && passengers.length >= totalPassengers;

   const button = (
      <div className={styles.buttonWrapper}>
         <button onClick={clickHandler} type="button" disabled={!isReady}>
            далее
         </button>
      </div>
   );

   return (
      <div>
         {passArray.map((item, index) => {
            const filledPassenger = passengers.find((pas) => pas.id === item.id);
            const passengerType =
               filledPassenger?.passengerType || getTypeByIndex(index);

            return (
            <PassengerCard
               key={item.id}
               passengerType={passengerType}
               id={item.id}
               pasNumber={index + 1}
               isLastPassenger={index === totalPassengers - 1}
               clickOnRemovePassHandler={clickOnRemovePassHandler}
               clickOnNextPassHandler={clickOnNextPassHandler}
               unchosenSeats={unchosenSeats}
               unchosenSeatsDep={unchosenSeatsDep}
               unchosenSeatsArr={unchosenSeatsArr}
               />
            );
         })}
         {passArray.length < totalPassengers && addPassenger}
         {(seatsDep.length > 0 || seatsArr.length > 0) && button}
      </div>
   );
}

export default PassengersSelection;
