<script setup lang="ts">
import { useFacetSearch } from '@/composables/meilisearch/useFacetSearch'
import type { FacetHit, Filter, FilterableAttributes, SortableAttributes } from 'meilisearch'
import { AlertTriangle } from '@lucide/vue'

const props = defineProps<{
    indexUid: string,
    filterableAttributes?: FilterableAttributes | null,
    sortableAttributes?: SortableAttributes | null,
    searching?: boolean,
    totalHits?: number,
    enableGeoFilters?: boolean,
}>()

const drawerOpen = defineModel<boolean>({ default: false })
const filter = defineModel<Filter | null>('filter', { required: true })
const geoSort = defineModel<string | null>('geoSort', { default: null })

const emit = defineEmits(['hide', 'searched'])

const { searchFacetValues } = useFacetSearch()

const selectedAttributes = ref<string[]>([])
type FacetFilterGroup = {
    attribute: string,
    facetHits: FacetHit[],
    value: string[],
}
const facetFilters = ref<Record<string, FacetFilterGroup>>({})
const facetFiltersEmpty = computed(() => Object.keys(facetFilters.value).length === 0)

const facetAttributeOptions = computed(() => {
    return ((props.filterableAttributes as string[]) ?? []).filter(attribute => attribute !== '_geo')
})

type GeoFilterMode = 'none' | 'radius' | 'boundingBox' | 'polygon'
const geoFilterMode = ref<GeoFilterMode>('none')
const geoFilterModeOptions = [
    { label: 'None', value: 'none' },
    { label: 'Radius', value: 'radius' },
    { label: 'Bounding Box', value: 'boundingBox' },
    { label: 'Polygon', value: 'polygon' },
]

const radiusLat = ref('')
const radiusLng = ref('')
const radiusMeters = ref('')

const boxTopLeftLat = ref('')
const boxTopLeftLng = ref('')
const boxBottomRightLat = ref('')
const boxBottomRightLng = ref('')

const polygonPointsInput = ref('')

type GeoSortDirection = 'none' | 'asc' | 'desc'
const geoSortDirection = ref<GeoSortDirection>('none')
const geoSortDirectionOptions = [
    { label: 'None', value: 'none' },
    { label: 'Nearest First', value: 'asc' },
    { label: 'Farthest First', value: 'desc' },
]
const geoSortLat = ref('')
const geoSortLng = ref('')

const hasGeoFilterSupport = computed(() => {
    return ((props.filterableAttributes as string[]) ?? []).includes('_geo')
})
const hasGeoSortSupport = computed(() => {
    return ((props.sortableAttributes as string[]) ?? []).includes('_geo')
})

function handleHideDrawer() {
    emit('hide')
}

function updateFacetFilterValue(attributeName: string, value: string[]) {
    const facetFilter = facetFilters.value[attributeName]

    if (!facetFilter) {
        return
    }

    facetFilter.value = value
}

function escapeFilterValue(value: string) {
    return value.replaceAll("'", "\\'")
}

function parseNumberValue(value: string): number | null {
    if (!value.trim()) {
        return null
    }

    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
        return null
    }

    return parsed
}

function parsePolygonCoordinates(value: string): Array<[number, number]> | null {
    const points = value
        .split(/\r?\n/g)
        .map(line => line.trim())
        .filter(Boolean)

    if (points.length < 3) {
        return null
    }

    const coordinates: Array<[number, number]> = []
    for (const point of points) {
        const [latInput, lngInput] = point.split(',').map(part => part.trim())
        if (!latInput || !lngInput) {
            return null
        }

        const lat = parseNumberValue(latInput)
        const lng = parseNumberValue(lngInput)
        if (lat === null || lng === null) {
            return null
        }

        coordinates.push([lat, lng])
    }

    return coordinates
}

const facetFilterExpression = computed<string | null>(() => {
    if (!facetFilters.value || Object.keys(facetFilters.value).length === 0) {
        return null
    }

    const filterExpressions: string[] = []
    Object.values(facetFilters.value).forEach((facetGroup) => {
        if (facetGroup.value.length > 0) {
            const attributeFilters = facetGroup.value
                .map(value => `${facetGroup.attribute} = '${escapeFilterValue(value)}'`)
                .join(' OR ')

            if (attributeFilters) {
                filterExpressions.push(`(${attributeFilters})`)
            }
        }
    })

    return filterExpressions.length > 0 ? filterExpressions.join(' AND ') : null
})

const geoFilterExpression = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoFilterMode.value === 'none' || !hasGeoFilterSupport.value) {
        return null
    }

    if (geoFilterMode.value === 'radius') {
        const lat = parseNumberValue(radiusLat.value)
        const lng = parseNumberValue(radiusLng.value)
        const meters = parseNumberValue(radiusMeters.value)
        if (lat === null || lng === null || meters === null) {
            return null
        }

        return `_geoRadius(${lat}, ${lng}, ${Math.round(meters)})`
    }

    if (geoFilterMode.value === 'boundingBox') {
        const topLeftLat = parseNumberValue(boxTopLeftLat.value)
        const topLeftLng = parseNumberValue(boxTopLeftLng.value)
        const bottomRightLat = parseNumberValue(boxBottomRightLat.value)
        const bottomRightLng = parseNumberValue(boxBottomRightLng.value)
        if (
            topLeftLat === null
            || topLeftLng === null
            || bottomRightLat === null
            || bottomRightLng === null
        ) {
            return null
        }

        return `_geoBoundingBox([${topLeftLat}, ${topLeftLng}], [${bottomRightLat}, ${bottomRightLng}])`
    }

    if (geoFilterMode.value === 'polygon') {
        const coordinates = parsePolygonCoordinates(polygonPointsInput.value)
        if (!coordinates) {
            return null
        }

        const points = coordinates.map(([lat, lng]) => `[${lat}, ${lng}]`).join(', ')
        return `_geoPolygon(${points})`
    }

    return null
})

const geoFilterValidationMessage = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoFilterMode.value === 'none') {
        return null
    }
    if (!hasGeoFilterSupport.value) {
        return 'Geo filtering requires "_geo" in filterableAttributes.'
    }

    if (geoFilterMode.value === 'radius') {
        if (!radiusLat.value.trim() || !radiusLng.value.trim() || !radiusMeters.value.trim()) {
            return 'Enter latitude, longitude, and radius in meters.'
        }

        const lat = parseNumberValue(radiusLat.value)
        const lng = parseNumberValue(radiusLng.value)
        const meters = parseNumberValue(radiusMeters.value)
        if (lat === null || lng === null || meters === null || meters <= 0) {
            return 'Radius values must be valid numbers and radius must be greater than 0.'
        }
    }

    if (geoFilterMode.value === 'boundingBox') {
        const values = [boxTopLeftLat.value, boxTopLeftLng.value, boxBottomRightLat.value, boxBottomRightLng.value]
        if (values.some(value => !value.trim())) {
            return 'Enter top-left and bottom-right latitude/longitude values.'
        }

        const parsedValues = values.map(parseNumberValue)
        if (parsedValues.some(value => value === null)) {
            return 'Bounding box coordinates must be valid numbers.'
        }
    }

    if (geoFilterMode.value === 'polygon') {
        if (!polygonPointsInput.value.trim()) {
            return 'Enter at least 3 lines with "lat,lng" coordinates.'
        }

        if (!parsePolygonCoordinates(polygonPointsInput.value)) {
            return 'Polygon format must be one "lat,lng" coordinate pair per line, at least 3 points.'
        }
    }

    return null
})

const combinedFilterExpression = computed<string | null>(() => {
    const expressions = [facetFilterExpression.value, geoFilterExpression.value].filter(Boolean)
    if (expressions.length === 0) {
        return null
    }

    return expressions.join(' AND ')
})

const geoSortExpression = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoSortDirection.value === 'none' || !hasGeoSortSupport.value) {
        return null
    }

    const lat = parseNumberValue(geoSortLat.value)
    const lng = parseNumberValue(geoSortLng.value)
    if (lat === null || lng === null) {
        return null
    }

    return `_geoPoint(${lat}, ${lng}):${geoSortDirection.value}`
})

const geoSortValidationMessage = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoSortDirection.value === 'none') {
        return null
    }
    if (!hasGeoSortSupport.value) {
        return 'Geo sorting requires "_geo" in sortableAttributes.'
    }

    if (!geoSortLat.value.trim() || !geoSortLng.value.trim()) {
        return 'Enter latitude and longitude for geo sorting.'
    }

    const lat = parseNumberValue(geoSortLat.value)
    const lng = parseNumberValue(geoSortLng.value)
    if (lat === null || lng === null) {
        return 'Geo sort coordinates must be valid numbers.'
    }

    return null
})

watch(selectedAttributes, async (newVal, oldVal) => {
    const added = newVal.filter(item => !oldVal?.includes(item))
    const removed = oldVal?.filter(item => !newVal.includes(item)) || []

    // populate the facet filters when attributes are checked
    if (added.length > 0) {
        await Promise.all(added.map(async (attributeName) => {
            const result = await searchFacetValues(props.indexUid, {
                facetName: attributeName,
            })
            facetFilters.value[attributeName] = {
                attribute: attributeName,
                facetHits: result?.facetHits ?? [],
                value: [],
            }
        }))
    }

    // remove facet filters when un-checked
    if (removed.length > 0) {
        removed.forEach((attributeName) => {
            const nextFacetFilters = { ...facetFilters.value }

            Reflect.deleteProperty(nextFacetFilters, attributeName)
            facetFilters.value = nextFacetFilters
        })
    }
})
watch(combinedFilterExpression, (newVal) => {
    filter.value = newVal
}, { immediate: true })

watch(geoSortExpression, (newVal) => {
    geoSort.value = newVal
}, { immediate: true })

watch(() => props.enableGeoFilters, (enabled) => {
    if (!enabled) {
        geoFilterMode.value = 'none'
        geoSortDirection.value = 'none'
    }
})
</script>

<template>
    <Drawer
        v-model:visible="drawerOpen"
        header="Filter Documents"
        class="w-full sm:w-[30rem]"
        position="right"
        @hide="handleHideDrawer"
    >
        <!-- TODO: manual input search -->
        <div class="mt-1 relative flex flex-col gap-4">
            <Message
                v-if="facetAttributeOptions.length === 0"
                pt:content:class="items-start"
                severity="warn"
            >
                <template #icon>
                    <AlertTriangle />
                </template>
                No facet filters available, please update the "filterableAttributes" index setting.
            </Message>
            <div
                v-if="facetAttributeOptions.length > 0"
                class="flex flex-col gap-2"
            >
                <label for="filterable-attributes">Facets</label>
                <MultiSelect
                    v-model="selectedAttributes"
                    :options="facetAttributeOptions"
                    pt:label:class="flex flex-wrap"
                    placeholder="Select facets to filter on"
                    filterPlaceholder="Search for facets"
                    inputId="filterable-attributes"
                    display="chip"
                    appendTo="self"
                    showClear
                    filter
                    fluid
                />
            </div>
            <Divider v-if="!facetFiltersEmpty" />
            <div
                v-if="!facetFiltersEmpty"
                class="flex flex-col gap-6"
            >
                <div
                    v-for="facetFilter in facetFilters"
                    :key="facetFilter.attribute"
                    class="flex flex-col gap-2"
                >
                    <label :for="`${facetFilter.attribute}_id`">{{ facetFilter.attribute }}</label>
                    <div class="relative">
                        <MultiSelect
                            :modelValue="facetFilter.value"
                            :options="facetFilter.facetHits"
                            :inputId="`${facetFilter.attribute}_id`"
                            :showToggleAll="false"
                            :disabled="props.searching"
                            filterPlaceholder="Search for facet values"
                            pt:label:class="flex flex-wrap"
                            pt:overlay:class="w-full"
                            optionValue="value"
                            optionLabel="value"
                            display="chip"
                            appendTo="self"
                            showClear
                            filter
                            fluid
                            @update:modelValue="(value) => updateFacetFilterValue(facetFilter.attribute, value)"
                        >
                            <template #option="{ option }">
                                {{ option.value }} ({{ option.count }})
                            </template>
                        </MultiSelect>
                    </div>
                </div>
            </div>

            <template v-if="props.enableGeoFilters">
                <Divider />
                <div class="flex flex-col gap-2">
                    <label for="geo-filter-mode">Geo Filter</label>
                    <Select
                        id="geo-filter-mode"
                        v-model="geoFilterMode"
                        :options="geoFilterModeOptions"
                        optionLabel="label"
                        optionValue="value"
                        appendTo="self"
                        fluid
                    />
                    <small class="text-muted-color">Use Meilisearch geo filters with manual coordinates.</small>
                </div>

                <div
                    v-if="geoFilterMode === 'radius'"
                    class="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                    <div class="flex flex-col gap-2">
                        <label for="geo-radius-lat">Latitude</label>
                        <InputText
                            id="geo-radius-lat"
                            v-model="radiusLat"
                            placeholder="45.472735"
                            fluid
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="geo-radius-lng">Longitude</label>
                        <InputText
                            id="geo-radius-lng"
                            v-model="radiusLng"
                            placeholder="9.184019"
                            fluid
                        />
                    </div>
                    <div class="flex flex-col gap-2 sm:col-span-2">
                        <label for="geo-radius-meters">Radius (meters)</label>
                        <InputText
                            id="geo-radius-meters"
                            v-model="radiusMeters"
                            placeholder="2000"
                            fluid
                        />
                    </div>
                </div>

                <div
                    v-else-if="geoFilterMode === 'boundingBox'"
                    class="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                    <div class="flex flex-col gap-2">
                        <label for="geo-box-top-left-lat">Top-left latitude</label>
                        <InputText
                            id="geo-box-top-left-lat"
                            v-model="boxTopLeftLat"
                            placeholder="45.494181"
                            fluid
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="geo-box-top-left-lng">Top-left longitude</label>
                        <InputText
                            id="geo-box-top-left-lng"
                            v-model="boxTopLeftLng"
                            placeholder="9.214024"
                            fluid
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="geo-box-bottom-right-lat">Bottom-right latitude</label>
                        <InputText
                            id="geo-box-bottom-right-lat"
                            v-model="boxBottomRightLat"
                            placeholder="45.449484"
                            fluid
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="geo-box-bottom-right-lng">Bottom-right longitude</label>
                        <InputText
                            id="geo-box-bottom-right-lng"
                            v-model="boxBottomRightLng"
                            placeholder="9.179175"
                            fluid
                        />
                    </div>
                </div>

                <div
                    v-else-if="geoFilterMode === 'polygon'"
                    class="flex flex-col gap-2"
                >
                    <label for="geo-polygon-points">Polygon points (lat,lng per line)</label>
                    <Textarea
                        id="geo-polygon-points"
                        v-model="polygonPointsInput"
                        rows="6"
                        placeholder="45.490, 9.170&#10;45.490, 9.210&#10;45.450, 9.190"
                        fluid
                    />
                </div>

                <Message
                    v-if="geoFilterValidationMessage"
                    severity="warn"
                    pt:content:class="items-start"
                >
                    <template #icon>
                        <AlertTriangle />
                    </template>
                    {{ geoFilterValidationMessage }}
                </Message>

                <Divider />

                <div class="flex flex-col gap-2">
                    <label for="geo-sort-mode">Geo Sort</label>
                    <Select
                        id="geo-sort-mode"
                        v-model="geoSortDirection"
                        :options="geoSortDirectionOptions"
                        optionLabel="label"
                        optionValue="value"
                        appendTo="self"
                        fluid
                    />
                </div>

                <div
                    v-if="geoSortDirection !== 'none'"
                    class="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                    <div class="flex flex-col gap-2">
                        <label for="geo-sort-lat">Reference latitude</label>
                        <InputText
                            id="geo-sort-lat"
                            v-model="geoSortLat"
                            placeholder="48.8561446"
                            fluid
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="geo-sort-lng">Reference longitude</label>
                        <InputText
                            id="geo-sort-lng"
                            v-model="geoSortLng"
                            placeholder="2.2978204"
                            fluid
                        />
                    </div>
                </div>

                <Message
                    v-if="geoSortValidationMessage"
                    severity="warn"
                    pt:content:class="items-start"
                >
                    <template #icon>
                        <AlertTriangle />
                    </template>
                    {{ geoSortValidationMessage }}
                </Message>
            </template>
        </div>
        <template #footer>
            <div
                v-if="props.totalHits"
                class="flex justify-center text-muted-color"
            >
                {{ props.totalHits.toLocaleString('en-US') }} estimated total hits
            </div>
        </template>
    </Drawer>
</template>
