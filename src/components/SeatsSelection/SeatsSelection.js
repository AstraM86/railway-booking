import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import SelectionBlock from './SelectionBlock/SelectionBlock';
import Redirect from '../Redirect/Redirect';

import { selectTrains } from '../../store/slices/trainSlice';
import { selectSelectedSeats } from '../../store/slices/seatsSlice';
import {
   selectNumberOfPassengers,
   removeNumOfPassengersDirection,
} from '../../store/slices/numOfpassengersSlice';

import directions from '../../data/directions';
import links from '../../data/links';

import styles from './SeatsSelection.module.scss';

function SeatsSelection() {
   const dispatch = useDispatch();
   const navigate = useNavigate();
   const arrival = useSelector(selectTrains)[directions.arrival]?._id;
   const departure = useSelector(selectTrains)[directions.departure]?._id;

   const [disabled, setDisabled] = useState(true);
   const selectedSeats = useSelector(selectSelectedSeats);
   const numberOfPassengers = useSelector(selectNumberOfPassengers);

   // Сколько мест выбрано
   const seatsDep =
      selectedSeats[directions.departure]
         ?.map((el) => el.seats)
         .flat()?.length ?? 0;
   const seatsArr =
      selectedSeats[directions.arrival]
         ?.map((el) => el.seats)
         ?.flat()?.length ?? 0;

   const passDep =
      (numberOfPassengers[directions.departure]?.adults || 0) +
      (numberOfPassengers[directions.departure]?.children || 0);
   const passArr =
      (numberOfPassengers[directions.arrival]?.adults || 0) +
      (numberOfPassengers[directions.arrival]?.children || 0);

   useEffect(() => {
      if (!arrival) {
         dispatch(removeNumOfPassengersDirection(directions.arrival));
      }
   }, [arrival, dispatch]);

   useEffect(() => {
      // Туда: мест должно быть столько же, сколько пассажиров с местами
      const departureValid = seatsDep > 0 && seatsDep === passDep;

      // Обратно: проверяем только если направление «обратно» выбрано
      const arrivalValid = !arrival || (seatsArr > 0 && seatsArr === passArr);

      setDisabled(!(departureValid && arrivalValid));
   }, [seatsDep, passDep, seatsArr, passArr, arrival]);

   const clickHandler = () => {
      navigate(links.passengers);
   };

   const button = (
      <div className={styles['seats-selection__button-wrapper']}>
         <button onClick={clickHandler} type="button" disabled={disabled}>
            далее
         </button>
      </div>
   );

   return (
      <section className={styles['seats-selection']}>
         <h3 className={styles['seats-selection__header']}>выбор мест</h3>
         {departure && <SelectionBlock direction={directions.departure} />}
         {arrival && <SelectionBlock direction={directions.arrival} />}
         {departure && button}
         <Redirect />
      </section>
   );
}

export default SeatsSelection;
