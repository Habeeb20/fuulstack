import { useEffect, useRef, useState } from "react";
import config from "../../config.json";
import axios from "axios";
import Calendar from "../../components/calendar/Calendar";

import { useAuth } from "../../contexts/AuthContext";

const ShortStay = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    address: "",
    hotel_id: "",
    tel_number: "",
    emergency_number: "",
    identity: "",
    id_number: "",
    number_of_people: "",
    room_id: "",
    nationality: "",
    country_of_residence: "",
    duration: "",
    price_per_night: "",
    email: "",
    name: "",
    deposit: "",
    balance: "",
    check_in_date: "",
    check_in_time: "",
    check_out: "",
    total_amount_paid: "",
    restaurant_bar_bill: "",
    travelling_from: "",
    travelling_to: "",
    additional_facilities: "",
    other_comments: "",
    ref: "",
    room_number: "",
    booking_date: "",
    payment_method: "cash",
    booking_method: "in_person",
    purpose_of_visit: "holiday",
    other_purpose_of_visit: "",
    accommodation_type: "",
    is_discount: "no",
    discount_price: null,
    total_amount: "",
  });

  const [message, setMessage] = useState(null);
  const [message2, setMessage2] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [bookedRooms, setBookedRooms] = useState([]);
  const [roomType, setRoomType] = useState([]);

  useEffect(() => {
    const currentDate = new Date();
    const checkInTime = currentDate.getHours();

    setFormData((prevData) => ({
      ...prevData,
      check_in_date: currentDate.toISOString().split("T")[0],
      booking_date: currentDate.toISOString().split("T")[0],
      check_in_time: currentDate.toTimeString().split(" ")[0],
    }));

    const oneHourLater = new Date(currentDate);
    oneHourLater.setHours(checkInTime + 2);

    setFormData((prevData) => ({
      ...prevData,
      check_out: oneHourLater.toISOString().slice(0, 16),
    }));
  }, []);

  useEffect(() => {
    async function fetchHotels() {
      const { data } = await axios.get(`$http://localhost:8000/hotels`);
      setHotels(data);
    }
    fetchHotels();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const photo = photoRef.current;
      const imageData = photo.toDataURL("image/jpeg");
      formDataToSend.append("selfie", dataURItoBlob(imageData), "selfie.jpg");

      await axios.post(`${config.apiUrl}/check-in-records`, formDataToSend);

      setLoading(false);
      setMessage({ type: "success", text: "Form submitted successfully!" });
      // window.location.reload();
    } catch (error) {
      setLoading(false);
      setMessage({
        type: "danger",
        text: "Error submitting the form. Please try again later.",
      });

      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  };

  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data } = await axios.get(
          `${config.apiUrl}/booked-rooms/${formData.hotel_id}`
        );
        setRoomType(data.result);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    }
    if (formData.hotel_id) {
      fetchRooms();
    }
  }, [formData.hotel_id]);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data } = await axios.get(
          `${config.apiUrl}/rooms/${formData.hotel_id}`
        );
        setRooms(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    }
    if (formData.hotel_id) {
      fetchRooms();
    }
  }, [formData.hotel_id]);

  let videoRef = useRef(null);
  let photoRef = useRef(null);

  const getUserCamera = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
        setShowWebcam(true);
      })
      .catch((err) => console.log(err));
  };

  const handleShowWebcam = () => {
    setShowWebcam(!showWebcam);
    if (!showWebcam) {
      getUserCamera();
    }
  };

  const takePicture = () => {
    let width = 500;
    let height = width / (19 / 9);

    let photo = photoRef.current;
    let video = videoRef.current;

    photo.width = width;
    photo.height = height;

    let ctx = photo.getContext("2d");
    ctx.drawImage(video, 0, 0, photo.width, photo.height);
  };

  const clearImage = () => {
    let photo = photoRef.current;
    let ctx = photo.getContext("2d");
    ctx.clearRect(0, 0, photo.width, photo.height);
  };

  const hideWebcame = () => {
    window.location.reload();
  };

  useEffect(() => {
    let stream;

    const getUserCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
        setShowWebcam(true);
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    if (showWebcam) {
      getUserCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showWebcam]);

  const handleCheckBookedRooms = async () => {
    // Check if hotel is selected
    if (!formData.hotel_id) {
      setMessage2({
        type: "danger",
        text: "Please select a hotel before checking booked rooms.",
      });
      return;
    }

    try {
      const response = await axios.get(
        `${config.apiUrl}/booked-rooms?hotel_id=${formData.hotel_id}&end_date=${endDate}`
      );

      // Check if there are no booked rooms
      if (Array.isArray(response.data) && response.data.length === 0) {
        setMessage2({
          type: "info",
          text: "No booked rooms for the selected time.",
        });
        return;
      }

      setBookedRooms(response.data);

      setMessage2({
        type: "success",
        text: "Booked rooms fetched successfully.",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage2(null);
      }, 3000);
    } catch (error) {
      console.error("Error checking booked rooms:", error);

      setMessage2({
        type: "danger",
        text:
          error.response.data.error ||
          "Error checking booked rooms. Please try again later.",
      });

      // Clear error message after 3 seconds
      setTimeout(() => {
        setMessage2(null);
      }, 3000);
    }
  };

  const roomTypeLabels = {
    super_executive: "Super Executive",
    executive: "Executive",
    standard_executive: "Standard Executive",
    room_apartment: "Room Apartment",
    transit: "Transit",
    transit_single: "Transit Single",
    transit_budget: "Transit Budget",
    transit_standard: "Transit Standard",
    standard: "Standard",
    executive_suite: "Executive Suite",
  };

  // Function to determine color and price based on room_type
  const getRoomTypeInfo = (roomType, pricePerNight) => {
    switch (roomType) {
      case "super_executive":
        return { color: "green", price: pricePerNight };
      case "executive":
        return { color: "blue", price: pricePerNight };
      case "standard_executive":
        return { color: "purple", price: pricePerNight };
      case "room_apartment":
        return { color: "orange", price: pricePerNight };
      case "transit":
        return { color: "yellow", price: pricePerNight };
      case "transit_single":
        return { color: "teal", price: pricePerNight };
      case "transit_budget":
        return { color: "brown", price: pricePerNight };
      case "transit_standard":
        return { color: "transit_standard", price: pricePerNight };
      case "standard":
        return { color: "gray", price: pricePerNight };
      case "executive_suite":
        return { color: "pink", price: pricePerNight };
      default:
        return { color: "gray", price: pricePerNight };
    }
  };

  const getRoomTypeInfo2 = (roomType) => {
    switch (roomType) {
      case "super_executive":
        return { color: "green" };
      case "executive":
        return { color: "blue" };
      case "standard_executive":
        return { color: "purple" };
      case "room_apartment":
        return { color: "orange" };
      case "transit":
        return { color: "yellow" };
      case "transit_single":
        return { color: "teal" };
      case "transit_budget":
        return { color: "brown" };
      case "transit_standard":
        return { color: "transit_standard" };
      case "standard":
        return { color: "gray" };
      case "executive_suite":
        return { color: "pink" };
      default:
        return { color: "gray" };
    }
  };

  const generateRandomAlphanumeric = (length) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset.charAt(randomIndex);
    }
    return result;
  };

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      ref: generateRandomAlphanumeric(20),
    }));
  }, []);

  const generateFormField = (fieldName, label, autoGenerate) => {
    if (autoGenerate) {
      return (
        <div className="col-6 col-md-3" key={fieldName}>
          <label htmlFor={fieldName} className="form-label">
            {label}
          </label>
          <input
            type="text"
            className="form-control"
            id={fieldName}
            name={fieldName}
            value={formData[fieldName]}
            readOnly
          />
        </div>
      );
    } else {
      return (
        <div className="col-6 col-md-3" key={fieldName}>
          <label htmlFor={fieldName} className="form-label">
            {label}
          </label>
          <input
            type="text"
            className="form-control"
            id={fieldName}
            name={fieldName}
            value={formData[fieldName]}
            onChange={handleChange}
            required
          />
        </div>
      );
    }
  };

  const formFields = [
    { fieldName: "ref", label: "Reference", autoGenerate: true },
  ];

  const roomTypeLabels2 = {
    budget: "Budget Room",
    standard: "Standard Room",
    executive: "Executive Room",
    luxury_executive: "Luxury Executive Room",
    late_night_deals: "Late Night Deals",
    weekend_deals: "Weekend Deals",
  };

  const roomTypePrices = {
    budget: { 1: 7500, 2: 10000 },
    standard: { 1: 10000, 2: 15000 },
    executive: { 1: 15000, 2: 20000 },
    luxury_executive: { 1: 25000, 2: 30000 },
    late_night_deals: { 1: 30, 2: 40 },
    weekend_deals: { 1: 10, 2: 20 },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "room_id") {
      const selectedRoom = rooms.find((room) => room.id === Number(value));

      if (selectedRoom) {
        setFormData((prevData) => ({
          ...prevData,
          room_number: selectedRoom.room_number,
          price_per_night: selectedRoom.price_per_night,
        }));
      }
    } else if (name === "accommodation_type") {
      const selectedRoomCategory = value;

      if (
        selectedRoomCategory === "late_night_deals" ||
        selectedRoomCategory === "weekend_deals"
      ) {
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      } else {
        const roomPrice = roomTypePrices[selectedRoomCategory];

        if (roomPrice !== undefined) {
          setFormData((prevData) => ({
            ...prevData,
            price_per_night: roomPrice[1],
            [name]: value,
          }));
        } else {
          console.error(`Invalid accommodation type: ${selectedRoomCategory}`);
        }
      }
    } else if (name === "duration_hours") {
      const selectedDuration = parseInt(value, 10) || 1;

      const currentDate = new Date();
      const checkInTime = currentDate.getHours();

      const oneHourLater = new Date(currentDate);
      oneHourLater.setHours(checkInTime + selectedDuration + 1);

      setFormData((prevData) => ({
        ...prevData,
        duration_hours: selectedDuration,
        price_per_night:
          roomTypePrices[prevData.accommodation_type][selectedDuration],
        check_out: oneHourLater.toISOString().slice(0, 16),
      }));
    } else if (name === "late_night_discount" || name === "weekend_discount") {
      const discountPercentage = Number(value);
      const originalPrice = formData.price_per_night;

      console.log("Original Price:", originalPrice);
      console.log("Discount Percentage:", discountPercentage);

      const discountedPrice =
        originalPrice - (originalPrice * discountPercentage) / 100;
      console.log("Calculated Discounted Price:", discountedPrice);

      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
        price_per_night: discountedPrice,
        discounted_price: discountedPrice,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  return (
    <>
      <div className="text-center my-4">
        <h2 className="mb-3">Terms and Conditions</h2>
        <p className="mb-4">
          2 Adults in a room maximum. Check-in from 11a.m. Checkout time is
          12p.m.
          <br />
          Payment can be made with Cash, POS, or Transfer. No smoking in the
          room or environment.
        </p>
        <h3 className="mb-4">RESERVATION FORM</h3>
        <Calendar setEndDate={setEndDate} />
        <div onClick={handleCheckBookedRooms} className="btn btn-primary">
          Check
        </div>
        {message2 && (
          <div className={`alert alert-${message2.type} mt-3`} role="alert">
            {message2.text}
          </div>
        )}

        {bookedRooms.length > 0 && (
          <div className="mt-3">
            <h3>Booked Rooms {bookedRooms.length}:</h3>
            <ul>
              {bookedRooms.map((room, index) => (
                <li key={index}>
                  Room {room.room_number} is booked from {room.check_in_date} to{" "}
                  {room.checkout_date}.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Displaying available rooms with different colors based on room_type */}
      <div className="text-center my-4">
        <div>
          <h2>Number of Rooms That Are Not Available: {roomType?.length}</h2>
          {roomType.map((room, index) => {
            const roomTypeInfo = getRoomTypeInfo2(room.roomtype);
            return (
              <div
                style={{
                  backgroundColor: roomTypeInfo.color,
                  padding: "5px",
                  margin: "5px",
                  display: "inline-block",
                  color: "white",
                  borderRadius: "5px",
                }}
                key={index}
              >
                Room: {room.roomtype}, Count: {room.typeCount}
              </div>
            );
          })}
        </div>

        {hotels.length > 0 ? (
          rooms.length > 0 ? (
            <h2>Number of Rooms Available: {rooms?.length}</h2>
          ) : null
        ) : (
          <h2>
            No hotels available. Please check back later or contact support.
          </h2>
        )}
        {rooms.map((room, index) => {
          const { color, price } = getRoomTypeInfo(
            room.room_type,
            room.price_per_night
          );
          const roomTypeLabel =
            roomTypeLabels[room.room_type] || room.room_type;

          return (
            <div
              key={index}
              style={{
                backgroundColor: color,
                padding: "5px",
                margin: "5px",
                display: "inline-block",
                color: "white",
                borderRadius: "5px",
              }}
            >
              Room {room.room_number} - {roomTypeLabel} (₦{price}/night)
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <h4>Customer details</h4>
          <div className="col-12 col-md-3">
            <label htmlFor="hotel_id" className="form-label">
              Select Hotel
            </label>
            <select
              className="form-select"
              id="hotel_id"
              name="hotel_id"
              value={formData.hotel_id}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Choose a hotel
              </option>
              {hotels
                .filter((hotel) => hotel.partner_id === user.id)
                .map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="room_id" className="form-label">
              Select Room Number
            </label>
            <select
              className="form-select"
              id="room_id"
              name="room_id"
              value={formData.room_id}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Choose a room
              </option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_number}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3" key="accommodation_type">
            <label htmlFor="accommodation_type" className="form-label">
              Accommodation Type
            </label>
            <select
              className="form-select"
              id="accommodation_type"
              name="accommodation_type"
              value={formData.accommodation_type}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select Room Category
              </option>
              {Object.keys(roomTypeLabels2).map((type) => (
                <option key={type} value={type}>
                  {roomTypeLabels2[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="duration_hours" className="form-label">
              Duration (hours)
            </label>
            <select
              className="form-select"
              id="duration_hours"
              name="duration_hours"
              value={formData.duration_hours}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select Duration
              </option>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
            </select>
          </div>

          {!(
            formData.accommodation_type === "late_night_deals" ||
            formData.accommodation_type === "weekend_deals"
          ) && (
            <div className="col-6 col-md-3">
              <label htmlFor="price_per_night" className="form-label">
                Price Per Hour
              </label>
              <input
                type="number"
                className="form-control"
                id="price_per_night"
                name="price_per_night"
                value={formData.price_per_night}
                onChange={handleChange}
                required
                readOnly
              />
            </div>
          )}

          {formData.accommodation_type === "late_night_deals" && (
            <div className="col-6 col-md-3">
              <label htmlFor="late_night_discount" className="form-label">
                Late Night Discount (%)
              </label>
              <select
                className="form-select"
                id="late_night_discount"
                name="late_night_discount"
                value={formData.late_night_discount || ""}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select Discount
                </option>
                <option value="20">20%</option>
                <option value="30">30%</option>
                <option value="40">40%</option>
              </select>
            </div>
          )}

          {formData.accommodation_type === "weekend_deals" && (
            <div className="col-6 col-md-3">
              <label htmlFor="weekend_discount" className="form-label">
                Weekend Discount (%)
              </label>
              <select
                className="form-select"
                id="weekend_discount"
                name="weekend_discount"
                value={formData.weekend_discount || ""}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select Discount
                </option>
                <option value="10">10%</option>
                <option value="20">20%</option>
                <option value="30">30%</option>
              </select>
            </div>
          )}

          {(formData.accommodation_type === "late_night_deals" ||
            formData.accommodation_type === "weekend_deals") && (
            <div className="col-6 col-md-3">
              <label htmlFor="discounted_price" className="form-label">
                Discounted Price
              </label>
              <input
                type="number"
                className="form-control"
                id="discounted_price"
                name="discounted_price"
                value={formData.discounted_price || ""}
                onChange={handleChange}
                required
                readOnly
              />
            </div>
          )}

          <div className="col-6 col-md-3">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <input
              type="text"
              className="form-control"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="tel_number" className="form-label">
              Telephone Number
            </label>
            <input
              type="text"
              className="form-control"
              id="tel_number"
              name="tel_number"
              value={formData.tel_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="emergency_number" className="form-label">
              Emergency Number
            </label>
            <input
              type="text"
              className="form-control"
              id="emergency_number"
              name="emergency_number"
              value={formData.emergency_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="identity" className="form-label">
              Identity
            </label>
            <input
              type="text"
              className="form-control"
              id="identity"
              name="identity"
              value={formData.identity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="id_number" className="form-label">
              ID Number
            </label>
            <input
              type="text"
              className="form-control"
              id="id_number"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="number_of_people" className="form-label">
              Number of People
            </label>
            <input
              type="text"
              className="form-control"
              id="number_of_people"
              name="number_of_people"
              value={formData.number_of_people}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="nationality" className="form-label">
              Nationality
            </label>
            <input
              type="text"
              className="form-control"
              id="nationality"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="travelling_from" className="form-label">
              Travelling From
            </label>
            <input
              type="text"
              className="form-control"
              id="travelling_from"
              name="travelling_from"
              value={formData.travelling_from}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="travelling_to" className="form-label">
              Travelling To
            </label>
            <input
              type="text"
              className="form-control"
              id="travelling_to"
              name="travelling_to"
              value={formData.travelling_to}
              onChange={handleChange}
              required
            />
          </div>

          {message && (
            <div className={`alert alert-${message.type} mt-3`} role="alert">
              {message.text}
            </div>
          )}
          <div className="col-6 col-md-3">
            <label htmlFor="country_of_residence" className="form-label">
              Country of Residence
            </label>
            <input
              type="text"
              className="form-control"
              id="country_of_residence"
              name="country_of_residence"
              value={formData.country_of_residence}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="duration" className="form-label">
              Duration
            </label>
            <input
              type="text"
              className="form-control"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="deposit" className="form-label">
              Deposit
            </label>
            <input
              type="text"
              className="form-control"
              id="deposit"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="balance" className="form-label">
              Balance
            </label>
            <input
              type="number"
              className="form-control"
              id="balance"
              name="balance"
              value={formData.balance}
              onChange={handleChange}
              readOnly
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="check_in_date" className="form-label">
              Check-in Date
            </label>
            <input
              type="date"
              className="form-control"
              id="check_in_date"
              name="check_in_date"
              value={formData.check_in_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="check_in_time" className="form-label">
              Check-in Time
            </label>
            <input
              type="time"
              className="form-control"
              id="check_in_time"
              name="check_in_time"
              value={formData.check_in_time}
              onChange={handleChange}
              required
            />
          </div>
          <h4>Hotel Details</h4>
          <div className="col-6 col-md-3">
            <label htmlFor="check_out" className="form-label">
              Check-out Date and Time
            </label>
            <input
              type="datetime-local"
              className="form-control"
              id="check_out"
              name="check_out"
              value={formData.check_out}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="restaurant_bar_bill" className="form-label">
              Restaurant/Bar Bill
            </label>
            <input
              type="text"
              className="form-control"
              id="restaurant_bar_bill"
              name="restaurant_bar_bill"
              value={formData.restaurant_bar_bill}
              onChange={handleChange}
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="additional_facilities" className="form-label">
              Additional Facilities
            </label>
            <input
              type="text"
              className="form-control"
              id="additional_facilities"
              name="additional_facilities"
              value={formData.additional_facilities}
              onChange={handleChange}
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="other_comments" className="form-label">
              Other Comments
            </label>
            <textarea
              className="form-control"
              id="other_comments"
              name="other_comments"
              value={formData.other_comments}
              onChange={handleChange}
            />
          </div>

          {formFields.map((field) =>
            generateFormField(field.fieldName, field.label, field.autoGenerate)
          )}

          <div className="col-6 col-md-3">
            <label htmlFor="room_number" className="form-label">
              Room Number
            </label>
            <input
              type="text"
              className="form-control"
              id="room_number"
              name="room_number"
              value={formData.room_number}
              onChange={handleChange}
              required
              readOnly
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="payment_method" className="form-label">
              Payment Method
            </label>
            <select
              className="form-select"
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="booking_method" className="form-label">
              Booking Method
            </label>
            <select
              className="form-select"
              id="booking_method"
              name="booking_method"
              value={formData.booking_method}
              onChange={handleChange}
              required
            >
              <option value="in_person">In Person</option>
              <option value="internet">Internet</option>
              <option value="agent">Agent</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="purpose_of_visit" className="form-label">
              Purpose of Visit
            </label>
            <select
              className="form-select"
              id="purpose_of_visit"
              name="purpose_of_visit"
              value={formData.purpose_of_visit}
              onChange={handleChange}
              required
            >
              <option value="holiday">Holiday</option>
              <option value="business">Business</option>
              <option value="others">Others</option>
            </select>
          </div>

          {formData.purpose_of_visit === "others" && (
            <div className="col-6 col-md-3">
              <label htmlFor="other_purpose_of_visit" className="form-label">
                Specify Other Purpose
              </label>
              <input
                type="text"
                className="form-control"
                id="other_purpose_of_visit"
                name="other_purpose_of_visit"
                value={formData.other_purpose_of_visit}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="col-6 col-md-3">
            <label htmlFor="hotel_location" className="form-label">
              Hotel Location
            </label>
            <input
              type="text"
              className="form-control"
              id="hotel_location"
              name="hotel_location"
              value={formData.hotel_location}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="branch_name" className="form-label">
              Branch Name
            </label>
            <input
              type="text"
              className="form-control"
              id="branch_name"
              name="branch_name"
              value={formData.branch_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="total_amount_paid" className="form-label">
              Total Amount Paid
            </label>
            <input
              type="number"
              className="form-control"
              id="total_amount_paid"
              name="total_amount_paid"
              value={formData.total_amount_paid}
              onChange={handleChange}
              required
            />
          </div>

          {showWebcam ? (
            <button
              type="button"
              onClick={hideWebcame}
              className="m-2 btn btn-danger"
            >
              Hide Webcam
            </button>
          ) : (
            <button
              type="button"
              onClick={handleShowWebcam}
              className="m-2 btn btn-primary"
            >
              Show Webcam
            </button>
          )}

          {showWebcam && <video required ref={videoRef}></video>}
          {showWebcam && (
            <button
              type="button"
              onClick={takePicture}
              className="m-2 btn btn-primary"
            >
              Take selfie
            </button>
          )}

          {showWebcam && <canvas required ref={photoRef}></canvas>}
          {showWebcam && (
            <button
              type="button"
              onClick={clearImage}
              className="m-2 btn btn-primary"
            >
              Clear image
            </button>
          )}

          <div className="d-flex">
            {loading && (
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
            <button className="m-2 btn btn-primary">Submit</button>
          </div>
        </div>
      </form>
    </>
  );
};

export default ShortStay;
