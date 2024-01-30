import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import useAxios from '../../utils/useAxios'
import { editStockSuggestionsURL } from '../backendURL'
import { fetchUserURL } from '../backendURL'

import {
  CheckIcon,
  ChevronUpDownIcon,
  PlusCircleIcon,
  MinusCircleIcon,
} from '@heroicons/react/20/solid'
import { Combobox } from '@headlessui/react'

const swal = require('sweetalert2')

function classNames(
  ...classes: (string | null | undefined | boolean)[]
): string {
  return classes.filter(Boolean).join(' ')
}

type CompanyArray = string[]

type StockType = CompanyArray[]

export interface UserProfile {
  full_name: string
  background_image: string
  profile_picture: string
  bio: string
  username: string
  values5: string[]
  follow_list: string[]
}

interface BackgroundImageState {
  background_image: string | null
  backgroundimageFile: File | null
}

interface ProfilePictureState {
  profile_picture: string | null
  profilepictureFile: File | null
}

const EditForm: React.FC<{ UserProfile: UserProfile }> = ({ UserProfile }) => {
  const [query, setQuery] = useState<string>('')
  const [inputIndex, setinputIndex] = useState<number>()
  const [listSuggestion, setlistSuggestion] = useState<string[]>([])
  const [Stock, setStock] = useState<StockType>([])
  const [full_name, setfull_name] = useState<string>('')
  const [values5, setvalues5] = useState<string[]>([])
  const [EditedValues5, setEditedValues5] = useState<string[]>([])
  const [bio, setbio] = useState<string>('')
  const [background_image, setbackground_image] =
    useState<BackgroundImageState>({
      background_image: null,
      backgroundimageFile: null,
    })
  const [profile_picture, setprofile_picture] = useState<ProfilePictureState>({
    profile_picture: null,
    profilepictureFile: null,
  })
  const gooseApp = useAxios()

  useEffect(() => {
    const fetchUserData = () => {
      if (UserProfile) {
        setvalues5(UserProfile.values5)
        setEditedValues5(UserProfile.values5)
        fetch(editStockSuggestionsURL)
          .then((response) => response.json())
          .then((data) => {
            if (data.list_field && Array.isArray(data.list_field)) {
              setStock(data.list_field)
            }
          })
      }
    }

    fetchUserData()
  }, [UserProfile])

  useEffect(() => {
    const companySuggestions = () => {
      const suggestions: string[] = []
      if (query.length > 3) {
        Stock.forEach((company) => {
          const joinedSuggestions = company.join('')
          if (joinedSuggestions.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push(joinedSuggestions)
          }
        })

        setlistSuggestion(suggestions)
      }
    }

    companySuggestions()
  }, [query])

  const handleBackgroundImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files ? e.target.files[0] : null
    if (file) {
      const formData = new FormData()

      formData.append('background_image', file)

      setbackground_image({
        ...background_image,
        background_image: URL.createObjectURL(file),
        backgroundimageFile: file,
      })
    }
  }

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files ? e.target.files[0] : null
    if (file) {
      const formData = new FormData()

      formData.append('profile_picture', file)

      setprofile_picture({
        ...profile_picture,
        profile_picture: URL.createObjectURL(file),
        profilepictureFile: file,
      })
    }
  }

  const SubtractCompany = async (index: number) => {
    const updatedValues = [...values5]
    updatedValues.splice(index, 1)

    if (updatedValues) {
      setEditedValues5(updatedValues)
      setvalues5(updatedValues)
      try {
        const formData = new FormData()

        if (updatedValues) {
          formData.append('values5', JSON.stringify(updatedValues))
        }

        const response = await gooseApp.patch(fetchUserURL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Important for file uploads
          },
        })
      } catch (error) {
        swal.fire({
          title: 'Could not add company',
          icon: 'error',
          toast: true,
          timer: 6000,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false,
        })
      }
    }
  }

  const addCompany = async () => {
    const updatedValues = [...values5]
    updatedValues.push('')

    if (updatedValues) {
      setvalues5(updatedValues)
      try {
        const formData = new FormData()

        if (updatedValues) {
          formData.append('values5', JSON.stringify(updatedValues))
        }

        const response = await gooseApp.patch(fetchUserURL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Important for file uploads
          },
        })
      } catch (error) {
        swal.fire({
          title: 'Could not add company',
          icon: 'error',
          toast: true,
          timer: 6000,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false,
        })
      }
    }
  }

  const handleSaveChanges = async () => {
    try {
      const formData = new FormData()

      // Append 'full_name' if it exists
      if (full_name) {
        formData.append('full_name', full_name)
      }

      // Append 'bio' if it exists
      if (bio) {
        formData.append('bio', bio)
      }
      if (EditedValues5) {
        formData.append('values5', JSON.stringify(EditedValues5))
      }

      if (background_image && background_image.backgroundimageFile) {
        formData.append(
          'background_image',
          background_image.backgroundimageFile
        )
      }

      if (profile_picture && profile_picture.profilepictureFile) {
        formData.append('profile_picture', profile_picture.profilepictureFile)
      }

      const response = await gooseApp.patch(fetchUserURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      })
      swal.fire({
        title: 'Profile Updated',
        icon: 'success',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })
      returnHome()
    } catch (error) {
      console.error('Error updating user')
    }
  }

  const returnHome = () => {
    window.location.href = '/profile'
  }

  const handlevalues5Focus = (index: number) => {
    const clearvalues5 = [...EditedValues5]
    clearvalues5[index] = ''
    setEditedValues5(clearvalues5)
  }

  const handleSelectValuesChange = (index: number, IndividualStock: string) => {
    const updatedValues = [...EditedValues5]
    updatedValues[index] = IndividualStock
    setEditedValues5(updatedValues)
  }

  return (
    <div>
      <div className="space-y-12">
        <div className="border-b border-white/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-white">
            Edit Profile
          </h2>
          <p className="text-sm leading-6 text-gray-400">
            This information will be displayed publicly so be careful what you
            share.
          </p>
        </div>
        <div className="border-b border-white/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-white">
            Media
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-400">
            This information will be displayed publicly so be careful what you
            share.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <div className="mt-2">
                <div className="flex rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500"></div>
              </div>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="cover-photo"
                className="block text-sm font-medium leading-6 text-white"
              >
                Profile Picture
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-white/25 px-6 py-10">
                <div className="text-center">
                  <UserCircleIcon
                    className="mx-auto h-16 w-16 text-gray-500"
                    aria-hidden="true"
                  />
                  <div className="mt-4 flex justify-center text-sm leading-6 text-gray-400">
                    <div className="ProfilePictureImageUpload">
                      <label htmlFor="profilePictureInput">
                        Upload a file
                        <br />
                      </label>
                      <input
                        className="ml-20"
                        type="file"
                        id="profilePictureInput"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="cover-photo"
                className="block text-sm font-medium leading-6 text-white"
              >
                Background Image
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-white/25 px-6 py-10">
                <div className="text-center">
                  <PhotoIcon
                    className="mx-auto h-16 w-16 text-gray-500"
                    aria-hidden="true"
                  />
                  <div className="mt-4 flex justify-center text-sm leading-6 text-gray-400">
                    <div className="BackgroundImageUpload">
                      <label htmlFor="backgroundImageInput">
                        Upload a file <br />
                      </label>
                      <input
                        className="ml-20"
                        type="file"
                        id="backgroundImageInput"
                        accept="image/*"
                        onChange={handleBackgroundImageChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-white">
            Personal Information
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-400">
            This information will be displayed publicly so be careful what you
            share.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="first-name"
                className="block text-sm font-medium leading-6 text-white"
              >
                Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="full_name"
                  id="full_name"
                  className="block w-full px-2 rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  onChange={(e) => {
                    setfull_name(e.target.value)
                  }}
                />

                <div className="col-span-full mt-10">
                  <label
                    htmlFor="about"
                    className="block text-sm font-medium leading-6 text-white"
                  >
                    Bio
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="about"
                      name="about"
                      rows={3}
                      className="block px-2 w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                      defaultValue={''}
                      onChange={(e) => {
                        setbio(e.target.value)
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-400">
                    Write a few sentences about yourself.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-white">
            Pinned Stocks
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-400">
            We'll always let you know about important changes, but you pick what
            else you want to hear about.
          </p>
          <div className="col-span-full mt-10">
            <label
              htmlFor="street-address"
              className="block text-sm font-medium leading-6 text-white "
            >
              Ticker | Company
            </label>
            {values5.map((value, index) => (
              <div key={index} className="flex items-center space-x-2 mt-4">
                <span className="text-m font-medium leading-6 text-gray-400  ">
                  {index + 1}.
                </span>
                <div className="w-full">
                  <Combobox
                    as="div"
                    onFocus={() => handlevalues5Focus(index)}
                    value={EditedValues5[index] || ''}
                    onChange={(IndividualStock) => {
                      handleSelectValuesChange(index, IndividualStock)
                    }}
                  >
                    <div className="relative mt-2">
                      <Combobox.Input
                        className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => {
                          setlistSuggestion([])
                        }}
                        displayValue={(IndividualStock: string) =>
                          IndividualStock
                        }
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </Combobox.Button>

                      {query.length >= 2 && listSuggestion.length > 0 && (
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {listSuggestion.map(
                            (IndividualStock, optionindex) => (
                              <Combobox.Option
                                key={optionindex}
                                value={IndividualStock}
                                className={({ active }) =>
                                  classNames(
                                    'relative cursor-default select-none py-2 pl-3 pr-9',
                                    active
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-gray-900'
                                  )
                                }
                              >
                                {({ active, selected }) => (
                                  <>
                                    <span
                                      className={classNames(
                                        'block truncate',
                                        selected && 'font-semibold'
                                      )}
                                    >
                                      {IndividualStock}
                                    </span>

                                    {selected && (
                                      <span
                                        className={classNames(
                                          'absolute inset-y-0 right-0 flex items-center pr-4',
                                          active
                                            ? 'text-white'
                                            : 'text-indigo-600'
                                        )}
                                      >
                                        <CheckIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Combobox.Option>
                            )
                          )}
                        </Combobox.Options>
                      )}
                    </div>
                  </Combobox>
                </div>
                <button
                  type="button"
                  className="flex mt-2 ml-4 rounded pr-2 px-1 py-1 items-center justify-center text-sm bg-gray-800/70 text-gray-400 shadow-sm hover:bg-white/20"
                  onClick={() => SubtractCompany(index)}
                >
                  <MinusCircleIcon
                    className="ml-1 h-6 w-6 text-gray-400"
                    aria-hidden="true"
                  />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="flex mt-4 ml-4 rounded pl-2 pr-2 px-1 py-1 text-sm bg-gray-800/70 text-gray-400 shadow-sm hover:bg-white/20"
              onClick={addCompany}
            >
              Add a company
              <PlusCircleIcon
                className="ml-1 h-6 w-6 text-gray-400"
                aria-hidden="true"
              />
            </button>
          </div>
          <div className="mt-10 space-y-10"></div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          className="text-sm font-semibold leading-6 text-white"
          onClick={returnHome}
        >
          Cancel
        </button>
        <button
          className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          onClick={() => {
            handleSaveChanges()
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default EditForm