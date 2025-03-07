import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import config from "../../config.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faCocktail,
  faSwimmingPool,
  faUtensils,
  faWifi,
  faDumbbell,
} from "@fortawesome/free-solid-svg-icons";
import "./inspectedHotelsByState.css";

export default function InspectedHotelsByState() {
  const { location } = useParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(location);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get(
          `${config.apiUrl}/inspected-hotels-by-location/${selectedLocation}`
        );
        setHotels(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedLocation]);

  useEffect(() => {
    async function fetchAllReviews() {
      try {
        const reviewsData = await Promise.all(
          hotels.map(async (hotel) => {
            const { data } = await axios.get(
              `${config.apiUrl}/reviews/${hotel.id}`
            );
            return { hotelId: hotel.id, reviews: data };
          })
        );

        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }

    fetchAllReviews();
  }, [hotels]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = hotels
    .filter((hotel) =>
      selectedAmenities.every((amenity) => hotel[amenity] === "Yes")
    )
    .slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const amenitiesList = [
    { key: "bar_lounge", label: "Bar and Lounge", icon: faCocktail },
    { key: "swimming_pool", label: "Swimming Pool", icon: faSwimmingPool },
    { key: "restaurants", label: "Restaurants", icon: faUtensils },
    { key: "internet", label: "Internet", icon: faWifi },
    { key: "gym", label: "Gym", icon: faDumbbell },
  ];

  const handleAmenityChange = (key) => {
    if (selectedAmenities.includes(key)) {
      setSelectedAmenities((prevSelected) =>
        prevSelected.filter((item) => item !== key)
      );
    } else {
      setSelectedAmenities((prevSelected) => [...prevSelected, key]);
    }
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  const renderAmenities = () => {
    return amenitiesList.map((amenity, index) => (
      <li key={index}>
        <input
          type="checkbox"
          id={amenity.key}
          checked={selectedAmenities.includes(amenity.key)}
          onChange={() => handleAmenityChange(amenity.key)}
        />
        <label htmlFor={amenity.key}>
          <FontAwesomeIcon icon={amenity.icon} /> {amenity.label}
        </label>
      </li>
    ));
  };

  return (
    <div className="container-fluid category-list">
      <h3>
        Select & book from {hotels.length}{" "}
        {hotels[0]?.building_type || "Hotels"}
      </h3>
      <div className="amenities">
        <div className="row">
          <div className="col-12">
            <div style={{ width: 200 }} className="mb-3">
              <label htmlFor="location" className="form-label">
                Select Location:
              </label>
              <select
                id="location"
                className="form-select"
                value={selectedLocation}
                onChange={handleLocationChange}
              >
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Kano">Kano</option>
              </select>
            </div>
            <h3>Filter by amenities</h3>
            <ul className="horizontal-list">{renderAmenities()}</ul>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {currentItems.length === 0 ? (
            <div className="col-12 mt-3">
              <div className="alert alert-info">
                No hotels found in the selected location and amenities.
              </div>
            </div>
          ) : (
            currentItems.map((hotel, index) => (
              <div
                key={index}
                className="category-col col-12 col-sm-6 col-md-3"
              >
                <Link
                  to={`/hotel/${hotel.hotel_id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card mb-5"
                    style={{
                      width: "18rem",
                      height: "25rem",
                      border: "none",
                      boxShadow: "0px 0px 6px 1px rgba(6, 6, 9, 0.1)",
                    }}
                  >
                    <img
                      style={{ height: "70%" }}
                      src={`${config.imageUrl}/${hotel.hotel.image.image_path}`}
                      className="card-img-top"
                      alt=""
                    />
                    <div className="card-body">
                      <h5 className="card-title">{hotel.hotel.name}</h5>
                      <ul className="custom-ul">
                        <li>
                          <FontAwesomeIcon icon={faLocationDot} />{" "}
                          {hotel.hotel.location}
                        </li>
                        <li>{hotel.hotel.adresse}</li>
                        <li>Reviews ({reviews.length})</li>
                        <li>
                          {hotel.hotel.verify ? "Verified" : "Not Verified"}
                        </li>
                        <li>Price per Night ₦{hotel.hotel.price}</li>
                      </ul>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      <nav>
        <ul className="pagination">
          {Array.from({
            length: Math.ceil(currentItems.length / itemsPerPage),
          }).map((item, index) => (
            <li
              key={index}
              className={`page-item ${
                currentPage === index + 1 ? "active" : ""
              }`}
            >
              <span className="page-link" onClick={() => paginate(index + 1)}>
                {index + 1}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
